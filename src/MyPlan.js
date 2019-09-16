import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import './inline.css';

//import NewPlanItemDialog from './NewPlanItemDialog';
import MyPlanItem from './MyPlanItem';

class MyPlan extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lala: "Planning for ",
      isPlanned: this.props.userdata.plan !== "",
    }
  }

  handleAddNewPlanItemEvent () {
    console.log("got event handleAddPlanItem");
    // Object.assign({}, this.props.userdata.plan, {newitem})
    //this.props.onAdd(); reder dialog and do callback(newplan)
  }

  render() {
    return (
      <div>
        <div>My Plan</div>

        <button id="butAdd" className="fab" aria-label="Add" onClick={this.handleAddNewPlanItemEvent}>
          <span className="icon add"></span>
        </button>

        {this.state.isPlanned &&
        <div>
          {
            this.props.userdata.plan.map(x =>
              (
                <MyPlanItem key={x.day+x.time+x.type}
                  day={x.day}
                  time={x.time}
                  type={x.type}
                  cross={this.props.onCross}
                />
              )
            )
          }
        </div>
      }
      </div>
    );
  }
}

export default withRouter(MyPlan);
