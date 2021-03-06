import React, { Component } from 'react';
import Helmet from 'react-helmet';
import AnalyticsActions from '../actions/AnalyticsActions';
import BrowserPushMessage from '../components/Widgets/BrowserPushMessage';
import LoadingWheel from '../components/LoadingWheel';
import { renderLog } from '../utils/logging';
import AddFriendsByEmail from '../components/Friends/AddFriendsByEmail';
import FriendsCurrentPreview from '../components/Friends/FriendsCurrentPreview';
import FriendInvitationsSentByMePreview from '../components/Friends/FriendInvitationsSentByMePreview';
import FriendInvitationsSentToMePreview from '../components/Friends/FriendInvitationsSentToMePreview';
import SuggestedFriendsPreview from '../components/Friends/SuggestedFriendsPreview';
import TwitterSignInCard from '../components/Twitter/TwitterSignInCard';
import VoterStore from '../stores/VoterStore';

// const facebookInfoText = "By signing into Facebook here, you can choose which friends you want to talk politics with, and avoid the trolls (or that guy from work who rambles on)! You control who is in your We Vote network.";

export default class Friends extends Component {
  static propTypes = {
  };

  constructor (props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount () {
    this.onVoterStoreChange();
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    AnalyticsActions.saveActionNetwork(VoterStore.electionId());
  }

  componentWillUnmount () {
    this.voterStoreListener.remove();
  }

  onVoterStoreChange () {
    this.setState({ voter: VoterStore.getVoter() });
  }

  render () {
    renderLog('Friends');  // Set LOG_RENDER_EVENTS to log all renders
    const { voter } = this.state;
    if (!voter) {
      return LoadingWheel;
    }

    return (
      <span>
        <Helmet title="Friends - We Vote" />
        <BrowserPushMessage incomingProps={this.props} />
        <div className="row">
          <div className="col-sm-12 col-md-8">
            <FriendInvitationsSentToMePreview />
            <SuggestedFriendsPreview />
            <section className="card">
              <div className="card-main">
                <h1 className="h4">
                  Add Friends by Email
                </h1>
                <AddFriendsByEmail />
              </div>
            </section>
            <FriendsCurrentPreview />
            {voter.signed_in_twitter ? null : (
              <div className="u-show-mobile">
                <TwitterSignInCard />
              </div>
            )}
            <FriendInvitationsSentByMePreview />
          </div>
          <div className="col-md-4 d-none d-md-block">
            {voter.signed_in_twitter ? null : (
              <TwitterSignInCard />
            )}
          </div>
        </div>
      </span>
    );
  }
}
