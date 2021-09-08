import React, { Component } from 'react';
import './App.css';
import { AmplifyAuthenticator, AmplifySignIn, AmplifySignUp } from "@aws-amplify/ui-react";
import { API, graphqlOperation, Amplify, Auth, Hub } from 'aws-amplify';
import { useEffect, useState } from 'react'
import { listCarriedCommandGames } from './graphql/queries'
import { createCarriedCommandGames } from './graphql/mutations'
import ReCAPTCHA from "react-google-recaptcha";

const config = {
  "aws_project_region": "us-east-2",
  "aws_cognito_identity_pool_id": "us-east-2:55b16092-9eeb-4ad4-be8e-cfb09c810086",
  "aws_cognito_region": "us-east-2",
  "aws_user_pools_id": "us-east-2_ZlDegqCR2",
  "aws_user_pools_web_client_id": "2oq0varh3cmq91ednj101m6fs9",
  "oauth": {},
  "aws_appsync_graphqlEndpoint": "https://irhgcpajqbfaxkih2plpn3guoi.appsync-api.us-east-2.amazonaws.com/graphql",
  "aws_appsync_region": "us-east-2",
  "aws_appsync_authenticationType": "API_KEY",
  "aws_appsync_apiKey": "da2-j22lveytnjemdpomzvmkwhvoqa"
};

Amplify.configure(config);

// https://docs.amplify.aws/start/getting-started/data-model/q/integration/react#deploying-the-api
// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html


class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      loggedIn: false,
      showSignIn: false,
      showSubmit: false,
      showAbout: false,
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
            showAbout: false,
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
        games: result.data.listCarriedCommandGames.items.sort((a, b) => new Date(b.created) - new Date(a.created))
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
        showAbout: false,
        onHome: true
      })

      API.graphql(graphqlOperation(listCarriedCommandGames))
      .then((result) => {
        this.setState({
          games: result.data.listCarriedCommandGames.items.sort((a, b) => new Date(b.created) - new Date(a.created))
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
        showAbout: false,
        onHome: false
      })
    }

    if (nav == "about")
    {
      this.setState({
        showSignIn: false,
        showSubmit: false,
        showAbout: true,
        onHome: false
      })
    }

    if (nav == "login")
    {
      this.setState({
        loggedIn: false,
        showSignIn: true,
        showSubmit: false,
        showAbout: false,
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
          showAbout: false,
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
      <div className="wrapper">
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome} onAbout={this.state.showAbout} />
        <AmplifyAuthenticator>
          <AmplifySignIn></AmplifySignIn>
          <AmplifySignUp
          slot="sign-up"
          formFields={[
            { type: "username" },
            {
              type: "password",
            },
            { type: "email" }
          ]} 
        ></AmplifySignUp>
        </AmplifyAuthenticator>
        <Footer /> 
      </div>
      )
    }
    if (this.state.showSubmit) {
      return (
      <div className="wrapper">
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome} onAbout={this.state.showAbout}  />
        <Submit author={this.state.username}/>
        <Footer />
      </div>
      )
    }
    if (this.state.showAbout) {
      return (
        <div className="wrapper">
        <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome} onAbout={this.state.showAbout}  />
        <About />
        <Footer />
      </div>
      )
    }
    return(
    <div className="wrapper">
      <Navigation onNavigation={this.handleNavigation} loggedIn={this.state.loggedIn} username={this.state.username} onHome={this.state.onHome} onAbout={this.state.showAbout}  />
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
    this.handleAbout = this.handleAbout.bind(this);
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

  handleAbout() {
    this.props.onNavigation("about");
  }

  render() {
    if (this.props.loggedIn) {
      if (this.props.onHome) {
        return (
        <div id="nav" className="nav">
          <div id="title" className="title">
              Carrier Commander
          </div>
          <div id="links" className="links">
            <a className="link current" onClick={this.handleHome}>Home</a>
            <a className="link" onClick={this.handleSubmit}>Submit</a>
            <a className="link" onClick={this.handleAbout}>About</a>
          </div>
        </div>
        )
      }
      if (this.props.onAbout) {
        return (
        <div id="nav" className="nav">
          <div id="title" className="title">
              Carrier Commander
          </div>
          <div id="links" className="links">
            <a className="link" onClick={this.handleHome}>Home</a>
            <a className="link" onClick={this.handleSubmit}>Submit</a>
            <a className="link current" onClick={this.handleAbout}>About</a>
          </div>
        </div>
        )
      }
      return (
      <div id="nav" className="nav">
        <div id="title" className="title">
              Carrier Commander
          </div>
        <div id="links" className="links">
          <a className="link" onClick={this.handleHome}>Home</a>
          <a className="link current" onClick={this.handleSubmit}>Submit</a>
          <a className="link" onClick={this.handleAbout}>About</a>
        </div>
      </div>
      )
    }
    if (this.props.onHome) {
      return (
        <div id="nav" className="nav">
          <div id="title" className="title">
              Carrier Commander
          </div>
          <div id="links" className="links">
            <a className="link current" onClick={this.handleHome}>Home</a>
            <a className="link" onClick={this.handleSubmit}>Submit</a>
            <a className="link" onClick={this.handleAbout}>About</a>
          </div>
        </div>
      )
    }
    if (this.props.onAbout) {
      return (
      <div id="nav" className="nav">
        <div id="title" className="title">
            Carrier Commander
        </div>
        <div id="links" className="links">
          <a className="link" onClick={this.handleHome}>Home</a>
          <a className="link" onClick={this.handleSubmit}>Submit</a>
          <a className="link current" onClick={this.handleAbout}>About</a>
        </div>
      </div>
      )
    }
    return (
      <div id="nav" className="nav">
        <div id="title" className="title">
              Carrier Commander
          </div>
        <div id="links" className="links">
          <a className="link" onClick={this.handleHome}>Home</a>
          <a className="link current" onClick={this.handleSubmit}>Submit</a>
          <a className="link" onClick={this.handleAbout}>About</a>
        </div>
      </div>
    )
  }
}

class GamesHeader extends Component {
  render () {
    return (
      <div className="left">
          <h1>Open Games (Last 3 Hours)</h1>
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
    var converted = new Date(Date.parse(game.created));
    var diffMins = Math.round(((now.getTime() - converted.getTime()) / 1000) / 60);
    if (diffMins <= 180) // 3 hours
    {
      game.age = diffMins + "m";
      return <Game 
        title={game.title} 
        author={game.author} 
        code={game.code} 
        password={game.password} 
        title={game.title} 
        players={game.players} 
        reports={game.reports} 
        age={game.age} 
        gamemode={game.gamemode} 
        humanteams={game.humanteams}
        aiteams={game.aiteams}
        basedifficulty={game.basedifficulty}
        islands={game.islands}
        loadout={game.loadout}
        startingislands={game.startingislands}
      />;
    
    }
  }

  createGames(games) {
    return games.map(this.createGame);
  }

  render() {

    if (this.props.Games) {
      return (
        <div className="games">
          <GamesHeader />
          {this.createGames(this.props.Games)}
        </div>
    )
    }
    else {
      return (
        <div className="games">
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
  // useEffect(() => {
  //   if (!author) {
  //     error("Please sign in or register.")
  //   }
  // })
  
  const [formState, setFormState] = useState([]);

  var passedReCAPTCHA = false;

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value})
  }

  function error(message)
  {
    document.getElementById("error").innerText = message;
  }

  function validate() {
    // if (!author) {
    //   error("Please sign in or register.")
    //   return false;
    // }
    if (!formState) {
      return false;
    }
    if (!passedReCAPTCHA) {
      error("Please complete ReCAPTCHA.")
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
    return true;
  }

  function onReCAPTCHAChange() {
    passedReCAPTCHA = true;
  }

  function addGame() {
    if (validate())
    {
      if (!formState.players) {
        formState.players = 2;
      }
      if (!formState.gamemode)
      {
        formState.gamemode = "Campaign";
      }
      var created = new Date;
      formState.created = created.toISOString();
      formState.author = author ? author : "public";
      formState.reports = 0;
      formState.id = formState.author + Math.round((new Date()).getTime() / 1000);
      API.graphql(graphqlOperation(createCarriedCommandGames, { input: formState}))
      .then((result) => {
        window.location.reload(false);
      })
      .catch((er) => {
        console.log(er);
      })
    }
  }

  if (formState.gamemode == "Campaign" || formState.gamemode == null)
  {
    return (
      <div className="submit">
        <label for="title">Title<span className="red">*</span></label> <br />
        <input className="game-input" type="text" id="title" onChange={event => setInput('title', event.target.value)}></input>
        <label for="gamemode">Game Mode<span className="red">*</span></label>
        <select className="game-input" onChange={event => setInput('gamemode', event.target.value)}>
          <option value="Campaign">Campaign</option>
          <option value="Custom">Custom</option>
        </select>
        <label for="title">Players<span className="red">*</span></label> <br />
        <input className="game-input" type="number" max="16" min="2" placeholder="2" name="title" id="players" onChange={event => setInput('players', event.target.value)}></input>
        <label for="title">Invite Code<span className="red">*</span></label> <br />
        <input className="game-input" type="text" placeholder="Invite Code" id="code" onChange={event => setInput('code', event.target.value)}></input>
        <label for="title">Password</label> <br />
        <input className="game-input" type="text" id="password" placeholder="Leave blank if no password" onChange={event => setInput('password', event.target.value)}></input>
        <label for="title">Description</label>
        <textarea onChange={event => setInput('description', event.target.value)}></textarea>
        <span id="error" className="error"></span>
        <ReCAPTCHA sitekey="6LeTJg0cAAAAAGcxjaPIkriuMj5SfMoC1I-OnFtL" onChange={onReCAPTCHAChange} />
        <br/>
        <button className="submit-button" onClick={addGame}>Create Game</button>
      </div>
    )
  }
  else {
    return (
      <div className="submit">
        <label for="title">Title<span className="red">*</span></label> <br />
        <input className="game-input" type="text" id="title" onChange={event => setInput('title', event.target.value)}></input>
        <label for="gamemode">Game Mode<span className="red">*</span></label>
        <select className="game-input" onChange={event => setInput('gamemode', event.target.value)}>
          <option value="Campaign">Campaign</option>
          <option value="Custom">Custom</option>
        </select>
        <label for="title">Players<span className="red">*</span></label> <br />
        <input className="game-input" type="number" max="16" min="2" placeholder="2" name="title" id="players" onChange={event => setInput('players', event.target.value)}></input>
        <label for="title">Invite Code<span className="red">*</span></label> <br />
        <input className="game-input" type="text" id="code" onChange={event => setInput('code', event.target.value)}></input>
        <label for="title">Password</label> <br />
        <input className="game-input" type="text" id="password" onChange={event => setInput('password', event.target.value)}></input>
        <label for="title">Islands<span className="red">*</span></label>
        <input className="game-input" type="number" max="64" min="4" placeholder="4" name="islands" id="islands" onChange={event => setInput('islands', event.target.value)}></input>
        <label for="title">Human Teams<span className="red">*</span></label>
        <input className="game-input" type="number" max="4" min="1" placeholder="1" name="humanteams" id="humanteams" onChange={event => setInput('humanteams', event.target.value)}></input>
        <label for="title">AI Teams<span className="red">*</span></label>
        <input className="game-input" type="number" max="4" min="0" placeholder="0" name="aiteams" id="aiteams" onChange={event => setInput('aiteams', event.target.value)}></input>
        <label for="title">Starting Islands<span className="red">*</span></label>
        <input className="game-input" type="number" max="64" min="1" placeholder="1" name="startingislands" id="startingislands" onChange={event => setInput('startingislands', event.target.value)}></input>
        <label for="title">Base Difficulty<span className="red">*</span></label>
        <input className="game-input" type="number" max="4" min="1" placeholder="1" name="basedifficulty" id="basedifficulty" onChange={event => setInput('basedifficulty', event.target.value)}></input>
        <label for="title">Loadout<span className="red">*</span></label>
        <select className="game-input" onChange={event => setInput('loadout', event.target.value)}>
          <option value="Default">Default</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
        <label for="title">Description</label>
        <textarea onChange={event => setInput('description', event.target.value)}></textarea>
        <span id="error" className="error"></span>
        <ReCAPTCHA sitekey="6LeTJg0cAAAAAGcxjaPIkriuMj5SfMoC1I-OnFtL" onChange={onReCAPTCHAChange} />
        <br/>
        <button className="submit-button" onClick={addGame}>Create Game</button>
      </div>
    )
  }
}

class Game extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    if (this.props.gamemode == "Custom")
    {
      return(
        <div className="game">
          <div className="game-top">
            <div className="game-mode">
            {this.props.gamemode}
            </div>
            <div className="game-title">
            {this.props.title}
            </div>
            <div className="players">
            <strong>Players:</strong>&nbsp;{this.props.players}
            </div>
            <div className="players">
            <strong>Human&nbsp;Teams:</strong>&nbsp;{this.props.humanteams ? this.props.humanteams : "N/A"}
            </div>
            <div className="players">
            <strong>AI&nbsp;Teams:</strong>&nbsp;{this.props.aiteams ? this.props.aiteams : "N/A"}
            </div>
            <div className="players">
            <strong>Islands:</strong>&nbsp;{this.props.islands ? this.props.islands : "N/A"}
            </div>
            <div className="difficulty">
            <strong>Difficulty:</strong>&nbsp;{this.props.basedifficulty ? this.props.basedifficulty : "N/A"}
            </div>
            <div className="age">
            Age:&nbsp;{this.props.age}
            </div>
          </div>
          <div className="game-bottom">
            <div className="code">
            {this.props.code}
            </div>
            <div className="password">
            Password:&nbsp;{this.props.password}
            </div>
          </div>
        </div>
      )
    }
    else {
      return(
        <div className="game">
          <div className="game-top">
            <div className="game-mode">
            {this.props.gamemode}
            </div>
            <div className="game-title">
            {this.props.title}
            </div>
            <div className="players">
            <strong>Players:</strong>&nbsp;{this.props.players}
            </div>
            <div className="age">
            Age:&nbsp;{this.props.age}
            </div>
          </div>
          <div className="game-bottom">
            <div className="code">
            {this.props.code}
            </div>
            <div className="password">
            Password:&nbsp;{this.props.password}
            </div>
          </div>
        </div>
      )
    }
  }
}

class About extends Component {
  render() {
    return(
      <div className="wrapper about">
        <h1>Carrier Commander</h1>
        <p><strong>This is a work in progress.</strong></p>
        <p>I plan on adding a lot more features.</p>
        <h2>Road Map</h2>
        <ul>
          <li>Individual pages for games with more information</li>
          <li>Ability to delete games after creation</li>
          <li>Tournaments</li>
          <li>Filters</li>
          <li>More information about game (PvP vs PvE, # of island, etc)</li>
          <li>Link to discord servers for voice chat</li>
          <li>Etc</li>
        </ul>
      </div>
    )
  }
}

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        Not Associated With Carrier Command 2
      </footer>
    )
  }
}

//export default withAuthenticator(App);
export default(App);