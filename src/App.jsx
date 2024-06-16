import * as FaIcons from "react-icons/fa";
import { Component, createRef } from 'react'
import './App.css'
import Shortcut from "./components/Shortcut";

export class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      shortcuts: JSON.parse(localStorage.getItem("shortcuts")) || [],
      input: {},
      saveShortcut: true
    }

    this.search = createRef()
    this.modal = createRef()
    this.modalNameInput = createRef()
    this.modalUrlInput = createRef()
    this.modalFaviconInput = createRef()
  }

  handleSearch = () => {
    let value = this.search.current.value

    if (value.startsWith("https://") || value.startsWith("http://")) {
      window.location.href = value
    } else {
      const query = value.replace(" ", "+")
      window.location.href = "https://www.google.com/search?q=" + query
    }
  }

  handleModal = () => {
    this.setState({
      input: {},
      saveShortcut: true
    })
    this.modal.current.classList.toggle("open")
  }

  onChange = (event) => {
    this.setState({
      input: {
        ...this.state.input, [event.target.name]: event.target.value
      }
    })
  }

  fillModal = async (data, index) => {
    const { title, url, favicon } = data
    this.setState({
      input: {
        index: index,
        name: title,
        url: url,
        favicon: favicon,
        prevName: title,
        prevUrl: url
      },
      saveShortcut: false,
    })

    this.modal.current.classList.toggle("open")
  }

  fetchFavicon = async (url) => {
    const response = await fetch(url);
    const status = response.status
    const html = await response.text();

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the favicon link
    const title = doc.title
    const link = doc.querySelector("link[rel*='icon']");

    return {
      status: status,
      data: { doc, title, link }
    }
  }

  addShortcut = async () => {
    const { name, url, favicon } = this.state.input

    const data = {
      title: name || url,
      url: url,
      favicon: favicon || false
    }

    await this.setState({
      shortcuts: this.state.shortcuts.concat(data)
    })
    const lastShortcut = this.state.shortcuts.length - 1
    this.handleModal()

    try {
      const response = await this.fetchFavicon(url)
      const { title, link } = response.data

      if (response.status === 403) {
        alert("Something wrong with response.")
      }

      if (link) {
        const _favicon = link.href;
        const shortcuts = this.state.shortcuts.concat()

        shortcuts.forEach((shortcut, index) => {
          if (index === lastShortcut) {
            shortcut.title = name || title
            shortcut.url = url
            shortcut.favicon = favicon || _favicon
          }
          return shortcuts
        })

        this.setState({
          shortcuts: shortcuts
        })

      } else {
        return null;
      }
    } catch (error) {
      // console.error('Error fetching favicon:', error);
      alert("No internet connection detected!")
      return null;
    }
  }

  editShortcut = async () => {
    const { name, url, prevName, prevUrl, favicon, index } = this.state.input
    let shortcuts = this.state.shortcuts.concat();
    this.modal.current.classList.toggle("open")

    if (name && prevName !== name && url === prevUrl) {
      shortcuts.forEach((shortcut, i) => {
        if (i === index) {
          shortcut.title = name
          shortcut.url = url
          shortcut.favicon = favicon
        }
        return shortcuts
      })

      this.setState({
        shortcuts: shortcuts
      })

      return
    }

    try {
      const response = await this.fetchFavicon(url)
      const { title, link } = response.data

      if (response.status === 403) {
        alert("Something wrong with response.")
      }

      if (link) {
        const favicon = link.href;
        let titleName;

        if (name && prevName !== name && url === prevUrl) {
          titleName = name
        }
        else if (name && url !== prevUrl) {
          titleName = name
        } else {
          titleName = title
        }

        shortcuts.forEach((shortcut, i) => {
          if (i === index) {
            shortcut.title = titleName
            shortcut.url = url
            shortcut.favicon = favicon
          }
          return shortcuts
        })

      } else {
        shortcuts.forEach((shortcut, i) => {
          if (i === index) {
            shortcut.title = name
            shortcut.url = url
            shortcut.favicon = null
          }
          return shortcuts
        })

      }
    } catch (error) {
      shortcuts.forEach((shortcut, i) => {
        if (i === index) {
          shortcut.title = name
          shortcut.url = url
          shortcut.favicon = null
        }
        return shortcuts
      })
    }

    this.setState({
      shortcuts: shortcuts
    })
  }

  removeShortcut = (index) => {
    const shortcuts = this.state.shortcuts.filter((shortcut, i) => {
      return index !== i
    })

    this.setState({
      shortcuts: shortcuts
    })
  }

  handleEnterPress = (event) => {
    if (event.key === 'Enter') {

      if (event.target === this.modalNameInput.current || this.modalUrlInput.current) {
        this.state.saveShortcut ? this.addShortcut() : this.editShortcut()
      }
      else if (event.target === this.search.current) {
        this.handleSearch()
      }

    }
  }

  componentDidMount() {
    const elements = [this.search, this.modalNameInput, this.modalUrlInput]

    elements.forEach(element => {
      if (element.current)
        element.current.addEventListener('keydown', this.handleEnterPress);
    })
  }

  componentWillUnmount() {
    const elements = [this.search, this.modalNameInput, this.modalUrlInput]

    elements.forEach(element => {
      if (element.current)
        element.current.removeEventListener('keydown', this.handleEnterPress);
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.shortcuts !== prevState.shortcuts) {
      localStorage.setItem("shortcuts", JSON.stringify(this.state.shortcuts))
    }
  }

  render() {
    return (
      <div className='app'>
        <h1>Google</h1>
        <div className="search">
          <FaIcons.FaSearch className="search-icon" />
          <input ref={this.search} type="text" name="search" placeholder="Search Google or type a URL" />
        </div>

        <div className="modal" ref={this.modal}>
          <div className="modal-content">
            <div className="title">Add shortcut</div>
            <div className="input-section">
              <div className="input-box">
                <span className="placeholder">Name</span>
                <input ref={this.modalNameInput} onChange={this.onChange} value={this.state.input.name || ""} type="text" name="name" />
              </div>
              <div className="input-box">
                <span className="placeholder">Url</span>
                <input ref={this.modalUrlInput} onChange={this.onChange} value={this.state.input.url || ""} type="text" name="url" />
              </div>
              <details>
                <summary className="extra">Optional</summary>
                <div className="input-box">
                <span className="placeholder">Favicon</span>
                <input ref={this.modalFaviconInput} onChange={this.onChange} value={this.state.input.favicon || ""} type="text" name="favicon" />
              </div>
              </details>
            </div>
            <div className="btn-container">
              <button className="cancel-btn" onClick={this.handleModal}>Cancel</button>
              <button disabled={this.state.input.url ? false : true} className="action-btn" onClick={this.state.saveShortcut ? this.addShortcut : this.editShortcut}>Save</button>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="shortcuts">
            {
              this.state.shortcuts.map((shortcut, index) => {
                return <Shortcut key={index} remove={this.removeShortcut} fillModal={this.fillModal} index={index} shortcut={shortcut} />
              })
            }
            <div className="add-shortcut">
              <div className="add-circle" onClick={this.handleModal}>
                <FaIcons.FaPlus className="add-icon" />
              </div>
              <span className="title">Add shortcut</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App
