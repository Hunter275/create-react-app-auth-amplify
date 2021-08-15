import React, { Component } from 'react';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import aws_exports from './aws-exports';
import { AmplifyAuthContainer, AmplifyAuthenticator, AmplifySignIn } from "@aws-amplify/ui-react";
import appSyncConfig from "./aws-exports";
import { API, graphqlOperation, Amplify, Auth, Hub, Logger } from 'aws-amplify';
import { useEffect, useState } from 'react'
import { listCarriedCommandGames } from './graphql/queries'
import { createCarriedCommandGames } from './graphql/mutations'
import { DateUtils } from '@aws-amplify/core';
import { AWSAppSyncProvider } from '@aws-amplify/pubsub';
Amplify.configure(aws_exports);

// const myAppConfig = {
//   'aws_appsync_graphqlEndpoint': 'https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
//   'aws_appsync_region': 'us-east-2',
//   'aws_appsync_authenticationType': 'API_KEY',
//   'aws_appsync_apiKey': 'da2-xxxxxxxxxxxxxxxxxxxxxxxxxx',
  

//   "aws_project_region": "us-east-2",
//   "aws_cognito_identity_pool_id": "us-east-2:55b16092-9eeb-4ad4-be8e-cfb09c810086",
//   "aws_cognito_region": "us-east-2",
//   "aws_user_pools_id": "us-east-2_ZlDegqCR2",
//   "aws_user_pools_web_client_id": "2oq0varh3cmq91ednj101m6fs9",
//   "oauth": {}
// }

// Amplify.configure(myAppConfig);

// https://docs.amplify.aws/start/getting-started/data-model/q/integration/react#deploying-the-api
// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html


class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      loggedIn: false,
      showSignIn: false,
      showSubmit: false,
      username: null,
      user: null,
      onHome: true,
      games: null
    }

    this.handleNavigation = this.handleNavigation.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  componentDidMount() {
    // https://docs.amplify.aws/lib/auth/auth-events/q/platform/js
    const listener = (data) => {
      switch (data.payload.event) {
        case "signIn":
          this.state.user = data.payload.data;
          this.setState({
            loggedIn: true,
            showSignIn: false,
            showSubmit: false,
            user: data.payload.data,
            username: data.payload.data.username,
          })
          break;
      }
    }


    Hub.listen('auth', listener);

    API.graphql(graphqlOperation(listCarriedCommandGames))
    .then((result) => {
      this.setState({
        games: result.data.listCarriedCommandGames.items
      })
    })
    .catch((error) => {
      console.log(error);
    })

    Auth.currentSession()
    .then((result) => {
      if (result !== null) {
        this.setState({
          loggedIn: true,
          showSignIn: false,
          showSubmit: false,
          user: result,
          username: result.idToken.payload.preferred_username
        })
      }
    })
    .catch((error) => {
      console.log("Not logged in");
      this.setState({
        loggedIn: false,
        showSignIn: false,
        showSubmit: false
      })
    })
 }

  handleLogin(user) {
    this.setState({
      loggedIn: true,
      showSignIn: false,
      showSubmit: false
    })
  }

  handleNavigation(nav) {
    if (nav == "home")
    {
      this.setState({
        showSignIn: false,
        showSubmit: false,
        onHome: true
      })

      API.graphql(graphqlOperation(listCarriedCommandGames))
      .then((result) => {
        this.setState({
          games: result.data.listCarriedCommandGames.items
        })
      })
      .catch((error) => {
        console.log(error);
      })
    }

    if (nav == "submit")
    {
      this.setState({
        showSignIn: false,
        showSubmit: true,
        onHome: false
      })
    }

    if (nav == "login")
    {
      this.setState({
        loggedIn: false,
        showSignIn: true,
        showSubmit: false,
        onHome: true
      })
    }

    if (nav == "logout")
    {
      Auth.signOut()
      .then((result) => {
        this.setState({
          loggedIn: false,
          showSignIn: false,
          showSubmit: false,
          onHome: true,
          user: null,
          username: null
        })
      })
    }
  }

  render() {
    if (this.state.showSignIn) {
      return (
        <div>
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome} />
        <AmplifyAuthenticator>
          <AmplifySignIn></AmplifySignIn>
        </AmplifyAuthenticator>
        <Footer />
      </div>
      )
    }
    if (this.state.showSubmit) {
      return (
        <div>
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome}  />
        <Submit author={this.state.username}/>
        <Footer />
      </div>
      )
    }
    return(
    <div>
      <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome}  />
      <Content Games={this.state.games}/>
      <Footer />
    </div>
    )
  }
}

class Content extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    var submitting = false;
    if (submitting) {
      return (
        <Submit />
      )
    }
    return (
      <Games Games={this.props.Games} />
    )
  }
}

class Navigation extends Component {
  constructor(props) {
    super(props);

    this.handleHome = this.handleHome.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleHome() {
    this.props.onNavigation("home");
  }

  handleSubmit() {
    this.props.onNavigation("submit");
  }

  handleLogin() {
    this.props.onNavigation("login");
  }

  handleLogout() {
    this.props.onNavigation("logout");
  }

  render() {
    if (this.props.loggedIn) {
      if (this.props.onHome) {
        return (
          <div className="content">
        <div id="nav" className="flex-container center nav">
          <div id="title" className="title flex-container">
            <div>
              <img className="logo" src="logosmall.png" alt=""></img>
            </div>
            <div>
              <h1>Carrier Commander</h1>
            </div>
          </div>
          <div id="links" className="links flex-container">
            <a className="link current" onClick={this.handleHome}>Home</a>
            <a className="link" onClick={this.handleSubmit}>Submit</a>
            <a className="link" onClick={this.handleLogout}>{this.props.username}, Sign Out</a>
          </div>
        </div>
      </div>
        )
      }
      return (
        <div className="content">
      <div id="nav" className="flex-container center nav">
        <div id="title" className="title flex-container">
          <div>
            <img className="logo" src="logosmall.png" alt=""></img>
          </div>
          <div>
            <h1>Carrier Commander</h1>
          </div>
        </div>
        <div id="links" className="links flex-container">
          <a className="link" onClick={this.handleHome}>Home</a>
          <a className="link current" onClick={this.handleSubmit}>Submit</a>
          <a className="link" onClick={this.handleLogout}>{this.props.username}, Sign Out</a>
        </div>
      </div>
    </div>
      )
    }
    if (this.props.onHome) {
      return (
        <div className="content">
        <div id="nav" className="flex-container center nav">
          <div id="title" className="title flex-container">
            <div>
              <img className="logo" src="logosmall.png" alt=""></img>
            </div>
            <div>
              <h1>Carrier Commander</h1>
            </div>
          </div>
          <div id="links" className="links flex-container">
            <a className="link current" onClick={this.handleHome}>Home</a>
            <a className="link" onClick={this.handleSubmit}>Submit</a>
            <a className="link" onClick={this.handleLogin}>Sign In</a>
          </div>
        </div>
      </div>
      )
    }
    return (
      <div className="content">
      <div id="nav" className="flex-container center nav">
        <div id="title" className="title flex-container">
          <div>
            <img className="logo" src="logosmall.png" alt=""></img>
          </div>
          <div>
            <h1>Carrier Commander</h1>
          </div>
        </div>
        <div id="links" className="links flex-container">
          <a className="link" onClick={this.handleHome}>Home</a>
          <a className="link current" onClick={this.handleSubmit}>Submit</a>
          <a className="link" onClick={this.handleLogin}>Sign In</a>
        </div>
      </div>
    </div>
    )
  }
}

class GamesHeader extends Component {
  render () {
    return (
      <div className="left">
          <h1>Open Games</h1>
        </div>
    )
  }
}
class Games extends Component {
  constructor(props) {
    super(props);
  }

  createGame(game) {
    var now = new Date();
    var converted = Date.parse(game.created);
    var diffMs = (now - converted);
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    game.age = diffMins + "m";
    return <Game title={game.title} author={game.author} code={game.code} password={game.password} title={game.title} players={game.players} reports={game.reports} age={game.age} />;
  }

  createGames(games) {
    return games.map(this.createGame);
  }

  render() {

    if (this.props.Games) {
      return (
        <div className="flex-container column">
          <GamesHeader />
          <div className="game game-header">
            <div className="game-title">
              <strong>Match Title</strong>
            </div>
            <div className="players">
              <strong>Players</strong>
            </div>
            <div className="code">
              <strong>Invite Code</strong>
            </div>
            <div className="password">
              <strong>Password</strong>
            </div>
            <div className="age">
              <strong>Age</strong>
            </div>
          </div>
          {this.createGames(this.props.Games)}
        </div>
    )
    }
    else {
      return (
        <div className="flex-container column">
          <GamesHeader />
          <div className="game game-header">
            <div className="game-title">
              <strong>Match Title</strong>
            </div>
            <div className="players">
              <strong>Players</strong>
            </div>
            <div className="code">
              <strong>Invite Code</strong>
            </div>
            <div className="password">
              <strong>Password</strong>
            </div>
            <div className="age">
              <strong>Age</strong>
            </div>
          </div>
        </div>
    )
    }
  }
}

const Submit = ({author}) => {
  
  const [formState, setFormState] = useState([]);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value})
  }

  function error(message)
  {
    document.getElementById("error").innerText = message;
  }

  function validate() {
    if (!author) {
      error("Please sign in or register.")
      return false;
    }
    if (!formState) {
      return false;
    }
    if (!formState.title)
    {
      error("Please input a title.")
      return false;
    }
    if (!formState.code)
    {
      error("Please input a code.")
      return false;
    }
    if (!formState.password)
    {
      error("Please input a password.")
      return false;
    }
    return true;
  }

  function addGame() {
    if (validate())
    {
      if (!formState.players) {
        formState.players = 2;
      }
      var created = new Date;
      formState.created = created.toISOString();
      formState.author = author;
      formState.reports = 0;
      formState.id = author + Math.round((new Date()).getTime() / 1000);
      API.graphql(graphqlOperation(createCarriedCommandGames, { input: formState}))
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
        error("Error when posting game, are you logged in?");
      })
    }
  }

  return (
    <div className="submit">
      <label for="title">Title</label> <br />
      <input type="text" id="title" className="game-input" onChange={event => setInput('title', event.target.value)}></input>
      <br />
      <br />
      <label for="title">Invite Code</label> <br />
      <input type="text" id="code" className="game-input" onChange={event => setInput('code', event.target.value)}></input>
      <br />
      <br />
      <label for="title">Password</label> <br />
      <input type="text" id="password" className="game-input" onChange={event => setInput('password', event.target.value)}></input>
      <br />
      <br />
      <label for="title">Players</label> <br />
      <input type="number" max="16" min="2" value="2" name="title" id="players" className="game-input" onChange={event => setInput('players', event.target.value)}></input>
      <br />
      <br />
      <span id="error" className="error"></span>
      <br />
      <button onClick={addGame}>Create Game</button>
    </div>
  )
}

class ErrorMessage extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <span className="error">{this.props.error}</span>
  }
}

class Game extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return(
      <div className="game">
            <div className="game-title">
            {this.props.title}
            </div>
            <div className="players">
            {this.props.players}
            </div>
            <div className="code">
            {this.props.code}
            </div>
            <div className="password">
            {this.props.password}
            </div>
            <div className="age">
            {this.props.age}
            </div>
          </div>
    )
  }
}

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
  <div className="flex-container center nav">
    <div className="flex-container center">
      <div className="discord">
        Not Affiliated With Carrier Command 2
      </div>
    </div>
  </div>
</footer>
    )
  }
}

//export default withAuthenticator(App);
export default(App);