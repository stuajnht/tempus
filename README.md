<p align="center">
  <img src="./assets/128x128.png" height="128">
</p>

<h2 align="center">
  Tempus
</h2>

<p align="center">
  A simple yet featureful pomodoro in the tray/menubar
</p>

<p align="center">
  <a href="https://ci.appveyor.com/project/KeziahMoselle/pomodoro">
    <img alt="Windows Release Badge" src="https://img.shields.io/appveyor/ci/keziahmoselle/pomodoro/master.svg?label=build%3Awindows&style=flat-square">
  </a>
    
  <a href="https://travis-ci.org/KeziahMoselle/tempus">
    <img alt="MacOS Release Badge" src="https://img.shields.io/travis/KeziahMoselle/tempus.svg?label=build%3Amac/linux&style=flat-square">
  </a>
  
  <a href="https://github.com/KeziahMoselle/tempus/releases/latest">
    <img alt="Version" src="https://img.shields.io/github/tag/KeziahMoselle/tempus.svg?label=version&style=flat-square">
  </a>

  <a href="https://github.com/KeziahMoselle/tempus/commits/master"> 
    <img alt="Last commit" src="https://img.shields.io/github/last-commit/KeziahMoselle/tempus/master.svg?style=flat-square">
  </a>
  
  <a href="https://github.com/KeziahMoselle/tempus/releases">
    <img alt="GitHub Downloads" src="https://img.shields.io/github/downloads/KeziahMoselle/tempus/total.svg?style=flat-square">
  </a>
  
</p>

<p align="center">
  <img width="90%" src="./.github/cover.png" alt="Tempus cover">
</p>

<h2>
  <a href="https://github.com/KeziahMoselle/pomodoro/releases">Download <img alt="Last GitHub version" src="https://img.shields.io/github/tag/KeziahMoselle/pomodoro.svg?label=%20&style=flat-square"></a>
</h2>

## Features

Click on the arrows to get more informations about these features

<details>
	<summary>⏱️ Change work time and pause time</summary>

  <p align="center">Want to work 27 min ? You can.</p>
	<p align="center">
    <img width="400" src="./.github/change_time.gif" alt="preview">
  </p>
</details>

<details>
	<summary>⏲️ Automagically set the timer till the next hour</summary>

  <p align="center">Want to work until 8 PM ? You can set the timer automagically for you.
  <br><b>Note</b>: It will revert your settings after the timer.
  </p>
	<p align="center">
    <img width="400" src="./.github/workTillNextHour.gif" alt="preview">
  </p>
</details>

<details>
	<summary>🚩 Goals</summary>

  <p align="center">Want to work at least 1 hour a day ? You can create a goal for that.</p>
	<p align="center">
    <img width="400" src="./.github/goals.gif" alt="preview">
  </p>
</details>

<details>
	<summary>🔥 Streak</summary>

  <p align="center">It counts how many times you finished a pomodoro.</p>
	<p align="center">
    <img width="400" src="./.github/streak.gif" alt="preview">
  </p>
</details>

<details>
	<summary>📊 Statistics</summary>

  <p align="center">It gives you insights about your productivity.</p>
	<p align="center">
    <img width="400" src="./.github/statistics.gif" alt="preview">
  </p>
</details>

<details>
	<summary>🔁 Cycles</summary>

  <p align="center">If set, it will automatically stop the pomodoro after `x` times.</p>
	<p align="center">
    <img width="400" src="./.github/cycles.gif" alt="preview">
  </p>
</details>

## Want to contribute ?

### Prerequisites
* Have [Node.js](https://nodejs.org/en/)  installed (> 8)
* Have [Yarn](https://yarnpkg.com/en/) installed

### Steps

1. Clone the repository
```sh
> git clone https://github.com/KeziahMoselle/tempus.git
```
2. Create a new branch (i.e: feat-new-feature)

3. Install dependencies :
```sh
> cd tempus && yarn
```
3. Run the app in `development` mode
```sh
> yarn dev
```

### Tests

See [Test Cases](./TESTCASES.md)

### Project tree

```
|-- tempus
    |-- assets              <-- Assets for the app
    |-- build               <-- The React build
    |-- dist                <-- Binaries will be generated here
    |-- public
    |   |-- utils           <-- Utility functions
    |   |-- app.js          <-- Electron main process
    |   |-- icons.js
    |   |-- index.html
    |   |-- preload.js      <-- Inject Node modules to the renderer process
    |   |-- store.js        <-- Store
    |   |-- icons
    |-- src                 <-- React App
        |-- App.jsx         <-- Main component
        |-- index.css       <-- Main CSS
        |-- index.js
        |-- components
        |-- fonts
```

## How to build ?

```sh
> yarn build
```
The binaries will be created in the `dist` folder.

## Built With

* [Electron](https://electronjs.org/) - framework for creating native applications with web technologies
* [React](https://reactjs.org) - A JavaScript library for building user interfaces

## Contributors

Thank you ❤️

<a href="https://github.com/KeziahMoselle"><img src="https://avatars3.githubusercontent.com/u/9168097?v=4" title="KeziahMoselle" width="80" height="80"></a>
<a href="https://github.com/stuajnht"><img src="https://avatars0.githubusercontent.com/u/13683986?v=4" title="stuajnht" width="80" height="80"></a>
<a href="https://github.com/ConorGrocock"><img src="https://avatars3.githubusercontent.com/u/15091494?v=4" title="ConorGrocock" width="80" height="80"></a>
<a href="https://github.com/rllola"><img src="https://avatars3.githubusercontent.com/u/1772945?v=4" title="rllola" width="80" height="80"></a>
<a href="https://github.com/raphaelts3"><img src="https://avatars1.githubusercontent.com/u/3309716?v=4" title="raphaelts3" width="80" height="80"></a>
<a href="https://github.com/bartius-nigel"><img src="https://avatars1.githubusercontent.com/u/33005791?s=460&v=4" title="bartius-nigel" width="80" height="80"></a>


## License

This project is licensed under the [MIT License](LICENSE).
