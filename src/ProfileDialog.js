import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import './inline.css';

class ProfileDialog extends Component {
  constructor(props) {
    super(props);
    this.handleDialogActionEvent = this.handleDialogActionEvent.bind(this);
    this.state = {
      sBookingUser: this.props.userdata.bookinguser,
      sBookingPass: this.props.userdata.bookingpass,
      sBookingName: this.props.userdata.bookingname,
      sBookingFull: this.props.userdata.bookingfull,
      sPaused: this.props.userdata.paused,
    }
  }

  handleDialogActionEvent() {
    console.log("got DialogActionEvent");
    let newProfileData = {"record_name": "user",
      "bookinguser": this.state.sBookingUser,
      "bookingpass": this.state.sBookingPass,
      "bookingname": this.state.sBookingName,
      "bookingfull": this.state.sBookingFull,
      "paused": this.state.sPaused,
    };
    this.props.onAbort();
    this.props.onAction(newProfileData);
  }

  render() {
    return (
      <div id="ProfileDialogComponent">
        <div className="dialog">
          <div className="dialog-title">Uppdatera din Norrort-profil</div>

          <div className="dialog-body">

            <div className="unit-title">Namn</div>
              <div className="unit">
                  <label htmlFor="fnamn">Förnamn</label>
                  <input type="text"
                         id="fnamn"
                         name="fnamn"
                         value={this.state.sBookingName}
                         onChange={(e) => this.setState({sBookingName: e.target.value})}
                  />
              </div>
              <div className="unit">
                  <label htmlFor="enamn">Efternamn</label>
                  <input type="text"
                         id="enamn"
                         name="enamn"
                         value={this.state.sBookingFull}
                         onChange={(e) => this.setState({sBookingFull: e.target.value})}
                  />
              </div>


            <div className="unit-title">Inloggning</div>
              <div className="unit">
                  <label htmlFor="username">Epost</label>
                  <input type="text"
                         id="username"
                         name="username"
                         value={this.state.sBookingUser}
                         onChange={(e) => this.setState({sBookingUser: e.target.value})}
                  />
              </div>
              <div className="unit">
                  <label htmlFor="passwd">Lösenord</label>
                  <input type="password"
                         id="passwd"
                         name="passwd"
                         minLength="8"
                         required
                        value={this.state.sBookingPass}
                         onChange={(e) => this.setState({sBookingPass: e.target.value})}
                  />
              </div>

              <div className="unit-title">Schemaläggning</div>
                <div className="unitH">
                  <input type="checkbox"
                         id="pause"
                         name="pause"
                         value={this.state.sPaused}
                         onChange={(e) => this.setState({sPaused: e.target.checked})}
                    />
                  <label htmlFor="pause">Inaktivera</label>
                </div>
              </div>


              <div className="dialog-buttons">
                <button
                  id="butDialogCancel"
                  className="button"
                  onClick={this.props.onAbort} >
                    Avbryt
                </button>
                <button
                  id="butDialogAdd"
                  className="button"
                  onClick={this.handleDialogActionEvent} >
                    Uppdatera
                </button>
              </div>

        </div>
      </div>
    );
  }
}

export default withRouter(ProfileDialog);
