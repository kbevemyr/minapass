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
    const options = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
      <div>
        {options.map((day, index) =>
          <div key={index}>
            <input type="radio"
              id={index}
              name="planday"
              value={day}
              checked={this.state.selectedOption === day}
              onChange={this.handleChangeEvent}
            />
          <label htmlFor="index">{day}</label>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(WeekdayInput);
