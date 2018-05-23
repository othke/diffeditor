import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Editor from './component/Editor'

const value = [
  [{ text: 'Hello world.', special: true }, { text: 'How are you', special: false }],
  [],
  [{ text: 'Where are you going today?', special: true }, { text: 'To the swimming pool.', special: true }]
]

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Diffing Editor</h1>
        </header>
        <Editor
          value={value}
          className="App-intro" />
      </div>
    );
  }
}

export default App;
