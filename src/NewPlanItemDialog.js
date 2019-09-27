import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import WeekdayInput from './WeekdayInput';

import './inline.css';

const passTypes = [{value: 'coach', text:'Grupppass'},
                   {value: 'manned', text:'Bemannat gym'},
                   {value: 'keycard', text:'Obemannat gym'},
                   {value: 'kids', text:'Barnpass'},
                   {value: 'competition', text:'Tävling'},
                 ];

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
              <label>Välj en dag</label>
              <WeekdayInput onChange={(v) => this.setState({sDay: v})}/>
            </div>

            <div className="unit">
              <label htmlFor="plantime">Välj en tid</label>
              <input required
                type="time"
                id="plantime"
                name="plantime"
                onChange={(e) => this.setState({sTime: e.target.value})}
              />
            </div>

            <div className="unit">
                <label htmlFor="passtype">Välj en klass</label>
                <select required id="selectPassType"
                  name="passtype"
                  defaultValue="coach"
                  onChange={(e) => this.setState({sType: e.target.value})}
                  aria-label="Pass type"
                >
                  {passTypes.map((x) =>
                    <option value={x.value}>{x.text}</option>
                    )
                  }
                </select>
            </div>

            {this.state.message !== "" &&
              <div className="unit">
                <p className="message">{this.state.message}</p>
              </div>
            }

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
