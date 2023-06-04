<div>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Remember</title>
  <meta charSet="UTF-8" />
  <meta
    name="keywords"
    content="Roomber,Remember,chat,talk,message,friends,fun"
  />
  <meta name="author" content="Suromi" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="A fork of Roomber" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Remember" />
  <meta property="og:description" content="What is Remember ?
  Remember is a chatting app forked from Roomber ! Roomber was originally made by Neksodebe and Someever. This fork is actively maintained !" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Remember" />
  <meta name="twitter:description" content="A fork of Roomber" />
  <meta content="#7289DA" data-react-helmet="true" name="theme-color" />
  <link rel="stylesheet" href="style.css" />
  <style
    dangerouslySetInnerHTML={{
      __html:
        "\n        .dark {\n         background: url('../assets/bgdark.png');\n            background-size: cover;\n        }\n\n        .light {\n            background: url('../assets/bglight.png');\n            background-size: cover;\n            color: black;\n        }\n    ",
    }}
  />
  <link rel="stylesheet" href="components/uprofile.css" />
  <link rel="stylesheet" href="components/setup.css" />
  <link rel="stylesheet" href="components/popup.css" />
  <link rel="stylesheet" href="components/horizontalMenu.css" />
  <link rel="stylesheet" href="components/minAdminPanel.css" />
  <link rel="stylesheet" href="components/adminPanel.css" />
  <link rel="stylesheet" href="components/settings.css" />
  <link rel="stylesheet" href="components/call.css" />
  <link rel="stylesheet" href="twemoji-amazing.css" />
  <link
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
    rel="stylesheet"
  />
  <link rel="preconnect" href="https://fonts.bunny.net" />
  <link rel="preconnect" href="https://fonts.bunny.net" crossOrigin />
  <link
    href="https://fonts.bunny.net/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    rel="stylesheet"
  />
  <div id="body">
    <div id="loading-back">
      <img alt src="assets/remember-logo.png" id="loading-image" />
      <div id="fun-fact-container">
        <p id="fun-fact-title" data-lcontent="loading.funfact.title">
          Did you know
        </p>
        <p id="fun-fact" />
      </div>
    </div>
    <div id="minAdminPanel">
      <div className="titlebar" data-dragger="true">
        <div className="title">
          <i className="megasmall material-icons">security</i>
          <span data-lcontent="adminpanel.min.title">Admin Panel</span>
        </div>
        <div className="close">
          <i className="megasmall material-icons">close</i>
        </div>
      </div>
      <button className="button" id="remove-all-messages">
        <i className="megasmall material-icons">clear_all</i>
        <span data-lcontent="adminpanel.min.clear_all">Clear Messages</span>
      </button>
      <button className="button" id="broadcast">
        <i className="megasmall material-icons">announcement</i>
        <span data-lcontent="adminpanel.min.broadcast">Broadcast</span>
      </button>
      <button className="button" id="full-panel">
        <i className="megasmall material-icons">security</i>
        <span data-lcontent="adminpanel.min.fullpanel">Full Panel</span>
      </button>
    </div>
    <div className="topbar-main flex-down">
      <div id="topbar" className="glass">
        <div id="topbar-content">
          <div id="by-the-logo">
            <img id="roomber-logo" src="assets/remember-logo.png" />
          </div>
          <div id="servers">
            <div className="topbar-sep" />
            <div id="server-list">
              <div title="New server" className="server basic new-server">
                <p className="no-select">
                  <i className="megasmall material-icons">add</i>
                </p>
              </div>
            </div>
            <div className="topbar-sep" />
          </div>
        </div>
      </div>
      <div className="flex">
        <div id="channels" className="glass">
          <ul></ul>
        </div>
        <div id="chat-area">
          <div id="messages"></div>
          <div
            id="attachment-indicator"
            data-lcontent="messagebox.attachmentindicator"
          >
            1 attachment{' '}
            <button className="button" id="remove-attachment">
              <i className="megasmall material-icons">close</i>
            </button>
          </div>
          <div id="message-box" className="glass">
            <div className="message-input">
              <input
                id="message"
                className="glass"
                placeholder="Message"
                autoComplete="off"
              />
              <button className="button" id="attach">
                <i className="megasmall material-icons">attach_file</i>
              </button>
              <button className="button" id="send">
                <i className="megasmall material-icons">send</i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="setup-container" />
  </div>
</div>;
