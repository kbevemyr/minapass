import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import ProfileDialog from './ProfileDialog';
import './inline.css';


class MyProfile extends Component {
  constructor(props) {
    super(props);
    this.handleOpenDialog = this.handleOpenDialog.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
    this.handleProfileEditEvent = this.handleProfileEditEvent.bind(this);
    this.state = {
      isDialogMode: false,
      passwordpresentation: this.props.userdata.bookingpass.replace(/\w/gi, 'x'),
    };
  }

  handleOpenDialog () {
    this.setState({isDialogMode: true});
  }
  handleCloseDialog () {
    this.setState({isDialogMode: false});
  }

  handleProfileEditEvent (x) {
    console.log("got handleAddPlanItem "+JSON.stringify(x));
    this.props.callback(x, this.handleCloseDialog);
  }

  render() {
    return (
      <div>
        <button id="butEdit" className="fab" aria-label="Edit" onClick={this.handleOpenDialog}>
          <span className="icon edit"></span>
        </button>

        <div id="MyProfileComponent" className="plan-card">
          <div className="card-spinner" hidden>
            <svg viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="14" fill="none"></circle>
            </svg>
          </div>
          <div className="description1">{this.props.userdata.bookinguser}</div>
          <div className="description">{this.state.passwordpresentation}</div>
          <div className="description">{this.props.userdata.bookingname}</div>
          <div className="description">{this.props.userdata.bookingfull}</div>
          {this.props.userdata.paused === "true" &&
            <div className="description">Schemläggningen är inaktiverad</div>
          }
        </div>

        {this.state.isDialogMode &&
          <ProfileDialog userdata={this.props.userdata} onAction={this.handleProfileEditEvent} onAbort={this.handleCloseDialog} />
        }
      </div>


    );
  }
}

export default withRouter(MyProfile);
