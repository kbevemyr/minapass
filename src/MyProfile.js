import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import './inline.css';


class MyProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lala: "Profile for ",
      passpresentation: this.props.userdata.bookingpass.replace(/\w/gi, 'x'),
    };
  }

  render() {
    return (
      <div id="MyProfileComponent" className="plan-card">
        <div className="card-spinner" hidden>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="none"></circle>
          </svg>
        </div>
        <div className="location">{this.props.userdata.bookinguser}</div>
        <div className="description">{this.state.passpresentation}</div>
        <div className="description">{this.props.userdata.bookingpass}</div>
        <div className="description">{this.props.userdata.bookingname}</div>
        <div className="description">{this.props.userdata.bookingfull}</div>
      </div>
    );
  }
}

export default withRouter(MyProfile);
