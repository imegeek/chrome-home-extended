import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import { Component, createRef } from 'react'
import Shortcut from "./components/Shortcut";
import './App.css'

export class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      shortcuts: JSON.parse(localStorage.getItem("shortcuts")) || [],
      undo: null,
      input: {},
      saveShortcut: true,
      draggedIndex: null
    }

    this.search = createRef()
    this.undo = createRef()
    this.modal = createRef()
    this.dropdown = createRef()
    this.modalNameInput = createRef()
    this.modalUrlInput = createRef()
    this.modalFaviconInput = createRef()
  }

  getRandomDarkColor() {
    // Generate random values for R, G, and B between 0 and 127
    const r = Math.floor(Math.random() * 128);
    const g = Math.floor(Math.random() * 128);
    const b = Math.floor(Math.random() * 128);

    // Convert R, G, and B to hexadecimal format and pad with leading zeros if necessary
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    // Combine R, G, and B values to form the full hex color code
    return `#${rHex}${gHex}${bHex}`;
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
    this.dropdown.current.classList.remove("active-dropdown")
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
        prevUrl: url,
        preFavicon: favicon
      },
      saveShortcut: false,
    })

    this.modal.current.classList.toggle("open")
  }

  fetchFavicon = async (url) => {
    // Create a new URL object
    const urlObject = new URL(url);

    // Get the origin of the URL
    url = urlObject.origin;

    const response = await fetch(url);
    const status = response.status
    const html = await response.text();

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the favicon link
    const title = doc.title
    let link = doc.querySelector("link[rel*='icon']");
    let faviconHref;

    if (link) {
      faviconHref = link.getAttribute("href");

      if (faviconHref.startsWith("/")) {
        faviconHref = url.concat(faviconHref)
      }

    } else {
      link = true
      faviconHref = url.concat("/favicon.ico")
    }

    return response, {
      status: status,
      data: { doc, title, link, faviconHref }
    }
  }

  addShortcut = async () => {
    let { url } = this.state.input
    let { name, favicon } = this.state.input

    if (!url.includes("://")) {
      url = "https://".concat(url)
    }

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

      const { title, link, faviconHref } = response.data

      if (link) {
        const shortcuts = this.state.shortcuts.concat()

        shortcuts.forEach((shortcut, index) => {
          if (index === lastShortcut) {
            shortcut.title = name || title
            shortcut.url = url
            shortcut.favicon = favicon || faviconHref
          }
          return shortcuts
        })

        this.setState({
          shortcuts: shortcuts
        })

      } else {
        return alert("Failed to fetch favicon data, set it manually.")
      }
    } catch (error) {
      return alert("There has been a problem with your fetch operation!")
    }
  }

  editShortcut = async () => {
    let { url } = this.state.input
    const { name, favicon, index, prevName, prevUrl, preFavicon } = this.state.input

    if (!url.includes("://")) {
      url = "https://".concat(url)
    }

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

    if (name && url && favicon !== preFavicon) {
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

  removeShortcut = async (index) => {
    clearTimeout(this.toastTimout);

    await this.setState({
      undo: this.state.shortcuts
    })

    const shortcuts = this.state.shortcuts.filter((shortcut, i) => {
      return index !== i
    })

    this.setState({
      shortcuts: shortcuts
    })

    this.undo.current.classList.add("show")

    this.toastTimout = setTimeout(() => {
      this.undo.current.classList.remove("show")
    }, 4000)

  }

  undoShortcut = () => {
    if (this.state.undo) {
      this.setState({
        shortcuts: this.state.undo
      })
    }

    this.undo.current.classList.remove("show")
    clearTimeout(this.toastTimout);
  }

  handleDropdown = () => {
    this.dropdown.current.classList.toggle("active-dropdown")
  }

  handleEnterPress = (event) => {
    if (event.key === 'Enter') {

      if (event.target === this.search.current) {
        this.handleSearch()
      }

      else if (event.target === this.modalNameInput.current || this.modalUrlInput.current || this.modalFaviconInput.current) {
        this.state.saveShortcut ? this.addShortcut() : this.editShortcut()
      }
    }
  }


  handleDragStart = (e, index) => {
    this.setState({
      draggedIndex: index
    })
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', null); // For Firefox compatibility
  };

  handleDragOver = (e, index) => {
    e.preventDefault();
    const draggedOverIndex = index;

    if (draggedOverIndex === this.state.draggedIndex) {
      return;
    }

    const newList = [...this.state.shortcuts];
    const draggedItem = newList[this.state.draggedIndex];

    // Remove the dragged item from its current position
    newList.splice(this.state.draggedIndex, 1);
    // Insert the dragged item at the new position
    newList.splice(draggedOverIndex, 0, draggedItem);

    this.setState({
      shortcuts: newList,
      draggedIndex: draggedOverIndex
    })

  };

  handleDragEnd = () => {
    this.setState({
      draggedIndex: null
    })
  };


  componentDidMount() {
    const elements = [this.search, this.modalNameInput, this.modalUrlInput, this.modalFaviconInput]

    elements.forEach(element => {
      if (element.current)
        element.current.addEventListener('keydown', this.handleEnterPress);
    })
  }

  componentWillUnmount() {
    const elements = [this.search, this.modalNameInput, this.modalUrlInput, this.modalFaviconInput]

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
        {/* <div className="nav">
          <iframe src="https://ogs.google.com/u/0/widget/app?bc=1" width={800} height={300}></iframe>
          <iframe src="https://ogs.google.com/u/0/widget/account" width={800} height={300}></iframe>
        </div> */}
        <h1>Google</h1>
        <div className="search">
          <FaIcons.FaSearch className="search-icon" />
          <input ref={this.search} type="text" name="search" placeholder="Search Google or type a URL" />
        </div>

        <div className="undo-toast" ref={this.undo}>
          <span>Shortcut removed</span>
          <span onClick={this.undoShortcut} className="undo">Undo</span>
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
              <div className="dropdown" ref={this.dropdown}>
                <div className="dropdown-box" onClick={this.handleDropdown}>
                  <span>Optional</span>
                  <MdIcons.MdOutlineKeyboardArrowDown className="down-arrow" />
                </div>
                <div className="dropdown-content">
                  <div className="input-box">
                    <span className="placeholder">Favicon</span>
                    <input ref={this.modalFaviconInput} onChange={this.onChange} value={this.state.input.favicon || ""} type="text" name="favicon" />
                  </div>
                </div>
              </div>
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
                return <div draggable key={index} className="wrapper"
                  style={
                    this.state.draggedIndex === index ?
                      {
                        opacity: 0,
                        transition: 'opacity 0.01s ease-in-out'
                      }
                      :
                      {
                        opacity: 1
                      }
                  }
                  onDragStart={(e) => this.handleDragStart(e, index)}
                  onDragOver={(e) => this.handleDragOver(e, index)}
                  onDragEnd={(e) => this.handleDragEnd(e)}
                >
                  <Shortcut remove={this.removeShortcut} fillModal={this.fillModal} index={index} shortcut={shortcut} />
                </div>
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
