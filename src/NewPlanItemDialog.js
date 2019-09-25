import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import WeekdayInput from './WeekdayInput';

import './inline.css';

class NewPlanItemDialog extends Component {
  constructor(props) {
    super(props);
    this.handleAddPlanItemEvent = this.handleAddPlanItemEvent.bind(this);
    this.state = {
      sDay: "",
      sTime: "",
      sType: "coach",
      message: "",
    }
  }

  handleAddPlanItemEvent() {
    console.log("got AddPlanItemEvent");
    if (this.state.sDay !== "" && this.state.sTime !== "" && this.state.sType !== "") {
      let newPlanItem = {"record_name": "plan", "day": this.state.sDay,"time": this.state.sTime, "type": this.state.sType};
      this.setState({message: ""});
      this.props.onAbort(); // borde tas bort och göras i onAdd funktionen
      this.props.onAdd(newPlanItem);
    } else {
      this.setState({message: "Fyll i alla fält tack!"});
    }
  }

  render() {
    return (
      <div id="NewPlanItemDialogComponent">
        <div className="dialog">
          <div className="dialog-title">Ny plan</div>

          <div className="dialog-body">
            <div className="unit">
              <p>Välj en dag</p>
              <WeekdayInput onChange={(v) => this.setState({sDay: v})}/>
            </div>

            <div className="unit">
              <p>Välj en tid</p>
              <input required
                type="time"
                id="plantime"
                name="plantime"
                onChange={(e) => this.setState({sTime: e.target.value})}
              />
            </div>

            <div className="unit">
                <p>Välj en klass</p>
                <select required id="selectPassType" defaultValue="coach" onChange={(e) => this.setState({sType: e.target.value})} aria-label="Pass type">
                  <option value="coach">Group</option>
                  <option value="manned">Open gym</option>
                  <option value="keycard">Locked gym</option>
                  <option value="kids">Kids</option>
                  <option value="competition">Competition</option>
                </select>
            </div>

            <p className="message">{this.state.message}</p>

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
                onClick={this.handleAddPlanItemEvent} >
                  Lägg till
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(NewPlanItemDialog);
