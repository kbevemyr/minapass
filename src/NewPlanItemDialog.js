import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import './inline.css';

class NewPlanItemDialog extends Component {
  constructor(props) {
    super(props);
    this.handleAddPlanItemEvent = this.handleAddPlanItemEvent.bind(this);
    this.state = {
      day: "",
      time: "",
      type: "",
      exceptions: [],
    }
  }

  handleAddPlanItemEvent() {
    console.log("got AddPlanItemEvent");

    // Hide the butDialog
    const sDay = "alladagar";
    const sTime = "00:01";
    const sType = "coach";
    console.log("data: "+sDay+", "+sTime+", "+sType);
  }

  render() {
    return (
      <div id="NewPlanItemDialogComponent">
        <div className="dialog">
          <div className="dialog-title">Ny plan</div>

          <div className="dialog-body">
            <p>Välj en dag</p>
            <div>
              <input type="radio" id="monday" name="planday" value="monday" />
              <label htmlFor="monday">måndag</label>
            </div>
            <div>
              <input type="radio" id="tuesday" name="planday" value="tuesday" />
              <label htmlFor="tuesday">tisdag</label>
            </div>
            <div>
              <input type="radio" id="wednesday" name="planday" value="wednesday" />
              <label htmlFor="wednesday">onsdag</label>
            </div>
            <div>
              <input type="radio" id="thursday" name="planday" value="thursday" />
              <label htmlFor="thursday">torsdag</label>
            </div>
            <div>
              <input type="radio" id="friday" name="planday" value="friday" />
              <label htmlFor="friday">fredag</label>
            </div>
            <div>
              <input type="radio" id="saturday" name="planday" value="saturday" />
              <label htmlFor="saturday">lördag</label>
            </div>
            <div>
              <input type="radio" id="sunday" name="planday" value="sunday" />
              <label htmlFor="sunday">söndag</label>
            </div>

            <p>Välj en tid</p>
            <input type="time" id="plantime" name="plantime" />

            <p>Välj en klass</p>
            <select id="selectPassType" aria-label="Pass type">
              <option value="coach">coach</option>
              <option value="manned">manned</option>
              <option value="keycard">keycard</option>
              <option value="kids">kids</option>
              <option value="competition">competition</option>
            </select>

          </div>

          <div className="dialog-buttons">
            <button id="butDialogCancel" className="button">Avbryt</button>
            <button
              id="butDialogAdd"
              className="button"
              onClick={this.handleAddPlanItemEvent} >
                Lägg till
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(NewPlanItemDialog);
