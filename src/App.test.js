import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const scheduledata = [{day: 'må', time: '19:30', exceptions: []}];

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
