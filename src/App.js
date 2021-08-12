import React, { Component } from 'react';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import aws_exports from './aws-exports';
import { AmplifyAuthContainer, AmplifyAuthenticator, AmplifySignIn } from "@aws-amplify/ui-react";
import appSyncConfig from "./aws-exports";
import { Amplify, Auth, Hub, Logger } from 'aws-amplify';
import { useEffect, useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { createGame } from './graphql/mutations'
import { listGames } from './graphql/queries'
Amplify.configure(aws_exports);

const logger = new Logger("CCLogger");

// https://docs.amplify.aws/start/getting-started/data-model/q/integration/react#deploying-the-api
const initialState = {
  title: '',
  players: 0,
  invite: '',
  password: '',
  reports: 0,
  creator: '',
  created: null
}

// const App = () => {
//   const [formState, setFormState] = useState([]);
//   const [todos, setTodos] = useState([])

//   useEffect(() => {
//     fetchGames()
//   }, [])

//   function setInput(key, value) {
//     setFormState({ ...formState, [key]: value})
//   }

//   async function fetchGames() {
//     try {
//       const gameData = await API.graphql(graphqlOperation(listGames));
//       const games = gameData.data.listGames.items;
//       setGames(games);
//     } catch (err) {
//       console.log("error fetching games: " + err);
//     }
//   }

//   async function addGame() {
//     try {
//       if (!formState.name || !formState.description) return;
//       const game = { ...formState };
//       setGames([...formState]);
//       setFormState(initialState);
//       await API.graphql(graphqlOperation(createGame, {input: game}));
//     } catch (err) {
//       console.log("error creating game: " + err);
//     }
//   }
// }

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      loggedIn: false,
      showSignIn: false,
      showSubmit: false,
      username: "Test",
      user: null
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
            username: data.payload.data.username
          })
          break;
      }
    }

    Hub.listen('auth', listener);

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
        showSubmit: false
      })
    }

    if (nav == "submit")
    {
      this.setState({
        showSignIn: false,
        showSubmit: true
      })
    }

    if (nav == "login")
    {
      this.setState({
        loggedIn: false,
        showSignIn: true,
        showSubmit: false
      })
    }

    if (nav == "logout")
    {
      Auth.signOut()
      .then((result) => {
        this.setState({
          loggedIn: false,
          showSignIn: false,
          showSubmit: false
        })
      })
    }
  }

  render() {
    if (this.state.showSignIn) {
      return (
        <div>
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} />
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
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} />
        <Submit />
        <Footer />
      </div>
      )
    }
    return(
    <div>
      <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} />
      <Content />
      <Footer />
    </div>
    )
  }
}

class Content extends Component {
  render() {
    var submitting = false;
    if (submitting) {
      return (
        <Submit />
      )
    }
    return (
      <Games />
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
          <a className="link current" onClick={this.handleHome}>Home</a>
          <a className="link" onClick={this.handleSubmit}>Submit</a>
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
  render() {
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
          <div className="game">
            <div className="game-title">
            Sam's Game
            </div>
            <div className="players">
            16
            </div>
            <div className="code">
            rkqst4efa3tsft5omydqrizoblychhqb7iw6hqnm
            </div>
            <div className="password">
            password
            </div>
            <div className="age">
            20m
            </div>
            <div className="report">
            Report
            </div>
          </div>
          <div className="game">
          <div className="game-title">
          This is a longer game title
          </div>
          <div className="players">
          8
          </div>
          <div className="code">
          rkqst4efa3tsft5omydqrizoblychhqb7iw6hqnm
          </div>
          <div className="password">
          password
          </div>
          <div className="age">
          33m
          </div>
          <div className="report">
          Report
          </div>
          </div>
        </div>
    )
  }
}

const Submit = () => {
  const [formState, setFormState] = useState([]);
  const [games, setGames] = useState([])

  useEffect(() => {
    fetchGames()
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value})
  }

  async function fetchGames() {
    try {
      const gameData = await API.graphql(graphqlOperation(listGames));
      const games = gameData.data.listGames.items;
      setGames(games);
    } catch (err) {
      console.log("error fetching games: " + err);
    }
  }

  async function addGame() {
    try {
      if (!formState.name || !formState.description) return;
      const game = { ...formState };
      setGames([...formState]);
      setFormState(initialState);
      await API.graphql(graphqlOperation(createGame, {input: game}));
    } catch (err) {
      console.log("error creating game: " + err);
    }
  }

  return (
    <div className="submit">
      <label for="title">Title</label> <br />
      <input type="text" name="title" id="title" className="game-input" onChange={event => setInput('title', event.target.value)}></input>
      <br />
      <br />
      <label for="title">Invite Code</label> <br />
      <input type="text" name="title" id="title" className="game-input" onChange={event => setInput('invite', event.target.value)}></input>
      <br />
      <br />
      <label for="title">Password</label> <br />
      <input type="text" name="password" id="password" className="game-input" onChange={event => setInput('password', event.target.value)}></input>
      <br />
      <br />
      <label for="title">Players</label> <br />
      <input type="number" max="16" min="2" value="2" name="title" id="title" className="game-input" onChange={event => setInput('players', event.target.value)}></input>
      <br />
      <br />
      <div className="white">Games are deleted after 3 hours.</div>
      <br />
      <button onClick={addGame}>Create Game</button>
    </div>
  )
}

// class Submit extends Component {
//   render() {
//     return (
//     <div className="submit">
//         <form action="" class="left">
//         <label for="title">Title</label> <br />
//         <input type="text" name="title" id="title" className="game-input"></input>
//         <br />
//         <br />
//         <label for="title">Invite Code</label> <br />
//         <input type="text" name="title" id="title" className="game-input"></input>
//         <br />
//         <br />
//         <label for="title">Password</label> <br />
//         <input type="text" name="password" id="password" className="game-input"></input>
//         <br />
//         <br />
//         <label for="title">Players</label> <br />
//         <input type="number" max="16" min="2" value="2" name="title" id="title" className="game-input"></input>
//         <br />
//         <br />
//         <div className="white">Games are deleted after 3 hours.</div>
//         <br />
//         <input type="submit" value="Submit Game"></input>
//       </form>
//     </div>
//     )
//   }
// }

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
