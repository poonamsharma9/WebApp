import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { prepareForCordovaKeyboard, restoreStylesAfterCordovaKeyboard } from '../../utils/cordovaUtils';
import { isSpeakerTypeOrganization } from '../../utils/organization-functions';
import LoadingWheel from '../LoadingWheel';
import OrganizationActions from '../../actions/OrganizationActions';
import OrganizationStore from '../../stores/OrganizationStore';
import VoterActions from '../../actions/VoterActions';
import VoterStore from '../../stores/VoterStore';
import { renderLog } from '../../utils/logging';

const delayBeforeApiUpdateCall = 1200;
const delayBeforeRemovingSavedStatus = 4000;


export default class SettingsWidgetFirstLastName extends Component {
  static propTypes = {
    displayOnly: PropTypes.bool,
    hideFirstLastName: PropTypes.bool,
    voterHasMadeChangesFunction: PropTypes.func,
  };

  constructor (props) {
    super(props);
    this.state = {
      firstName: '',
      displayOnly: false,
      isOrganization: false,
      initialNameLoaded: false,
      lastName: '',
      linkedOrganizationWeVoteId: '',
      organizationName: '',
      organizationNameSavedStatus: '',
      voterNameSavedStatus: '',
    };

    this.handleKeyPressOrganizationName = this.handleKeyPressOrganizationName.bind(this);
    this.handleKeyPressVoterName = this.handleKeyPressVoterName.bind(this);
    this.updateOrganizationName = this.updateOrganizationName.bind(this);
    this.updateVoterName = this.updateVoterName.bind(this);
  }

  componentWillMount () {
    prepareForCordovaKeyboard('SettingsWidgetFirstLastName');
  }

  componentDidMount () {
    this.onVoterStoreChange();
    this.organizationStoreListener = OrganizationStore.addListener(this.onOrganizationStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    this.setState({
      displayOnly: this.props.displayOnly,
    });
  }

  componentWillUnmount () {
    this.organizationStoreListener.remove();
    this.voterStoreListener.remove();
    this.timer = null;
    this.clearStatusTimer = null;
    restoreStylesAfterCordovaKeyboard('SettingsWidgetFirstLastName');
  }

  onOrganizationStoreChange () {
    const organization = OrganizationStore.getOrganizationByWeVoteId(this.state.linkedOrganizationWeVoteId);
    if (organization && organization.organization_type) {
      this.setState({
        isOrganization: isSpeakerTypeOrganization(organization.organization_type),
        organizationName: organization.organization_name,
      });
    }
  }

  onVoterStoreChange () {
    if (VoterStore.isVoterFound()) {
      const voter = VoterStore.getVoter();
      this.setState({
        voter,
      });
      if (!this.state.initialNameLoaded) {
        this.setState({
          firstName: VoterStore.getFirstName(),
          lastName: VoterStore.getLastName(),
          initialNameLoaded: true,
        });
      }
      if (voter && voter.linked_organization_we_vote_id) {
        this.setState({
          linkedOrganizationWeVoteId: voter.linked_organization_we_vote_id,
        });
        if (voter.linked_organization_we_vote_id !== this.state.linkedOrganizationWeVoteId) {
          const organization = OrganizationStore.getOrganizationByWeVoteId(voter.linked_organization_we_vote_id);
          if (organization && organization.organization_type) {
            this.setState({
              isOrganization: isSpeakerTypeOrganization(organization.organization_type),
              organizationName: organization.organization_name,
            });
          }
        }
      }
    }
  }

  handleKeyPressOrganizationName () {
    clearTimeout(this.timer);
    if (this.props.voterHasMadeChangesFunction) {
      this.props.voterHasMadeChangesFunction();
    }
    this.timer = setTimeout(() => {
      OrganizationActions.organizationNameSave(this.state.linkedOrganizationWeVoteId, this.state.organizationName);
      this.setState({ organizationNameSavedStatus: 'Saved' });
    }, delayBeforeApiUpdateCall);
  }

  handleKeyPressVoterName () {
    clearTimeout(this.timer);
    if (this.props.voterHasMadeChangesFunction) {
      this.props.voterHasMadeChangesFunction();
    }

    this.timer = setTimeout(() => {
      VoterActions.voterNameSave(this.state.firstName, this.state.lastName);
      this.setState({ voterNameSavedStatus: 'Saved' });
    }, delayBeforeApiUpdateCall);
  }

  updateOrganizationName (event) {
    if (event.target.name === 'organizationName') {
      this.setState({
        organizationName: event.target.value,
        organizationNameSavedStatus: 'Saving Organization Name...',
      });
    }
    // After some time, clear saved message
    clearTimeout(this.clearStatusTimer);
    this.clearStatusTimer = setTimeout(() => {
      this.setState({ organizationNameSavedStatus: '' });
    }, delayBeforeRemovingSavedStatus);
  }

  updateVoterName (event) {
    if (event.target.name === 'firstName') {
      this.setState({
        firstName: event.target.value,
        voterNameSavedStatus: 'Saving First Name...',
      });
    } else if (event.target.name === 'lastName') {
      this.setState({
        lastName: event.target.value,
        voterNameSavedStatus: 'Saving Last Name...',
      });
    }
    // After some time, clear saved message
    clearTimeout(this.clearStatusTimer);
    this.clearStatusTimer = setTimeout(() => {
      this.setState({ voterNameSavedStatus: '' });
    }, delayBeforeRemovingSavedStatus);
  }

  render () {
    renderLog('SettingsWidgetFirstLastName');  // Set LOG_RENDER_EVENTS to log all renders
    if (!this.state.voter) {
      return LoadingWheel;
    }

    return (
      <div className="">
        {this.state.voter ? (
          <span>
            {this.state.isOrganization ? (
              <span>
                {this.state.displayOnly ? (
                  <div>
                    <div>{this.state.organizationName}</div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); }}>
                    <label htmlFor="organization-name">
                      Organization Name as Shown on Your Voter Guides
                      <input
                        type="text"
                        autoComplete="organization"
                        className="form-control"
                        id="organization-name"
                        name="organizationName"
                        placeholder="How would you like your organization name displayed publicly?"
                        onKeyDown={this.handleKeyPressOrganizationName}
                        onChange={this.updateOrganizationName}
                        value={this.state.organizationName}
                      />
                    </label>
                    <div className="u-gray-mid">{this.state.organizationNameSavedStatus}</div>
                  </form>
                )}
              </span>
            ) : (
              <span>
                {this.state.displayOnly ? (
                  <div>
                    <div>
                      {this.state.firstName}
                      {' '}
                      {this.state.lastName}
                    </div>
                    <div>{this.state.organizationName}</div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); }}>
                    {!this.props.hideFirstLastName ? (
                      <span>
                        <label htmlFor="first-name">
                          First Name
                          <input
                            type="text"
                            autoComplete="given-name"
                            className="form-control"
                            id="first-name"
                            name="firstName"
                            placeholder="First Name"
                            onKeyDown={this.handleKeyPressVoterName}
                            onChange={this.updateVoterName}
                            value={this.state.firstName}
                          />
                        </label>
                        <label htmlFor="last-name">
                          Last Name
                          <input
                            type="text"
                            autoComplete="family-name"
                            className="form-control"
                            id="last-name"
                            name="lastName"
                            placeholder="Last Name"
                            onKeyDown={this.handleKeyPressVoterName}
                            onChange={this.updateVoterName}
                            value={this.state.lastName}
                          />
                        </label>
                        <div className="u-gray-mid">{this.state.voterNameSavedStatus}</div>
                      </span>
                    ) : null
                    }
                    <label htmlFor="organization-name">
                      Name Shown with Endorsements
                      <input
                        type="text"
                        autoComplete="organization"
                        className="form-control"
                        id="organization-name"
                        name="organizationName"
                        placeholder="How would you like your name displayed publicly?"
                        onKeyDown={this.handleKeyPressOrganizationName}
                        onChange={this.updateOrganizationName}
                        value={this.state.organizationName}
                      />
                    </label>
                    <div className="u-gray-mid">{this.state.organizationNameSavedStatus}</div>
                  </form>
                )}
              </span>
            )}
          </span>
        ) :
          <div><Link to="/settings/account">Please Sign In</Link></div>
        }
      </div>
    );
  }
}
