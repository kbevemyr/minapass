import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import './inline.css';

class WeekdayInput extends Component {
  constructor(props) {
    super(props);
    this.handleChangeEvent = this.handleChangeEvent.bind(this);
    this.state = {
      selectedOption: "",
    }
  }

  handleChangeEvent = (e) => {
    var newSelected = e.target.value;
    this.setState({selectedOption: newSelected}, () => this.props.onChange(newSelected));
  }

  render() {
    const options = [{value: 'monday', text: 'måndag'},
                      {value: 'tuesday', text: 'tisdag'},
                      {value: 'wednesday', text: 'onsdag'},
                      {value: 'thursday', text: 'torsdag'},
                      {value: 'friday', text: 'fredag'},
                      {value: 'saturday', text: 'lördag'},
                      {value: 'sunday', text: 'söndag'},
                    ];

    return (
      <div>
        {options.map((day, index) =>
          <div key={index}>
            <input type="radio"
              id={index}
              name="planday"
              value={day.value}
              checked={this.state.selectedOption === day.value}
              onChange={this.handleChangeEvent}
            />
          <label htmlFor="index">{day.text}</label>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(WeekdayInput);
