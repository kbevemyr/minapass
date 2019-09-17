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
      sType: "",
      exceptions: [],
    }
  }

  handleAddPlanItemEvent() {
    console.log("got AddPlanItemEvent");
    console.log("data: "+this.state.sDay+", "+this.state.sTime+", "+this.state.sType);
    this.props.callback();
  }

  render() {
    return (
      <div id="NewPlanItemDialogComponent">
        <div className="dialog">
          <div className="dialog-title">Ny plan</div>

          <div className="dialog-body">

              <p>Välj en dag</p>
              <WeekdayInput onChange={(v) => this.setState({sDay: v})}/>

              <p>Välj en tid</p>
              <input
                type="time"
                id="plantime"
                name="plantime"
                onChange={(e) => this.setState({sTime: e.target.value})}
              />

              <p>Välj en klass</p>
              <select id="selectPassType" onChange={(e) => this.setState({sType: e.target.value})} aria-label="Pass type">
                <option value="coach">coach</option>
                <option value="manned">manned</option>
                <option value="keycard">keycard</option>
                <option value="kids">kids</option>
                <option value="competition">competition</option>
              </select>

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
      </div>
    );
  }
}

export default withRouter(NewPlanItemDialog);
