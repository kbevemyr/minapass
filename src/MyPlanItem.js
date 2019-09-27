import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import './inline.css';
const passTypes = [{value: 'coach', text:'Grupppass'},
                   {value: 'manned', text:'Bemannat gym'},
                   {value: 'keycard', text:'Obemannat gym'},
                   {value: 'kids', text:'Barnpass'},
                   {value: 'competition', text:'Tävling'},
                 ];

const weekdaysText = [
                   {value: 'monday', text:'måndag'},
                   {value: 'tuesday', text:'tisdag'},
                   {value: 'wednesday', text:'onsdag'},
                   {value: 'thursday', text:'torsdag'},
                   {value: 'friday', text:'fredag'},
                   {value: 'saturday', text:'lördag'},
                   {value: 'sunday', text:'söndag'},
                 ];

class MyPlanItem extends Component {
  constructor(props) {
    super(props);
    this.handleDeletePlanItemEvent = this.handleDeletePlanItemEvent.bind(this);
    this.state = {
      lala: "this and that",
    }
  }

  handleDeletePlanItemEvent() {
    console.log("got handleDeletePlanItemEvent");
    this.props.onCross({day: this.props.day, time: this.props.time, type: this.props.type});
  }

  render() {
    return (
      <div id="MyPlanItemComponent" className="plan-card">
        <div className="card-spinner" hidden>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="none"></circle>
          </svg>
        </div>
        <button className="cross" onClick={this.handleDeletePlanItemEvent}>&times;</button>
        <div className="group">
        <div className="location">{weekdaysText.find(x => x.value === this.props.day).text}</div>
        <div className="description">{this.props.time}</div>
        <div className="description">{passTypes.find(x => x.value === this.props.type).text}</div>
        </div>
      </div>
    );
  }
}

export default withRouter(MyPlanItem);
