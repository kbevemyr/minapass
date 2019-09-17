import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import './inline.css';

import NewPlanItemDialog from './NewPlanItemDialog';
import MyPlanItem from './MyPlanItem';

class MyPlan extends Component {
  constructor(props) {
    super(props);
    this.handleOpenDialog = this.handleOpenDialog.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
    this.handleAddPlanItem = this.handleAddNewPlanItem.bind(this);
    this.state = {
      isPlanned: this.props.userdata.plan !== "",
      addDialog: false,
    }
  }

  handleOpenDialog () {
    this.setState({addDialog: true});
  }
  handleCloseDialog () {
    this.setState({addDialog: false});
  }

  handleAddNewPlanItem (newplanitem) {
    console.log("got handleAddNewPlanItem "+JSON.stringify(newplanitem));
    // Object.assign({}, this.props.userdata.plan, {newitem})
    //this.props.onAdd(); reder dialog and do callback(newplan)
    this.setState({addDialog: false});
  }

  render() {
    return (
      <div>
        <div>My Plan</div>

        <button id="butAdd" className="fab" aria-label="Add" onClick={this.handleOpenDialog}>
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

      {this.state.addDialog &&
        <NewPlanItemDialog callback={this.handleAddNewPlanItem}/>
      }
      </div>
    );
  }
}

export default withRouter(MyPlan);
