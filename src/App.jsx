import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import { Component, createRef } from 'react'
import Shortcut from "./components/Shortcut";
import './App.css'

export class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      theme: localStorage.getItem("theme") || "device",
      background: localStorage.getItem("background"),
      color: localStorage.getItem("color"),
      shortcuts: JSON.parse(localStorage.getItem("shortcuts")) || [],
      showShortcuts: localStorage.getItem("showShortcuts") || "true",
      undo: null,
      input: {},
      favicons: [],
      newFavicon: null,
      saveShortcut: true,
      draggedIndex: null
    }

    this.search = createRef()
    this.menu = createRef()
    this.image = createRef()
    this.preview = createRef()
    this.confirm = createRef()
    this.status = createRef()
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
      favicons: [],
      newFavicon: null,
      saveShortcut: true
    })
    this.modal.current.classList.toggle("open")
    this.modalUrlInput.current.focus()
    this.dropdown.current.classList.remove("active-dropdown")
  }

  onChange = (event) => {
    this.setState({
      input: {
        ...this.state.input, [event.target.name]: event.target.value
      }
    })
  }

  editModal = async (data, index) => {
    const { title, url, favicon, favicons } = data
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

    this.setState({
      favicons: favicons
    })
    this.modal.current.classList.toggle("open")
    this.modalUrlInput.current.focus()
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
    let nodeList = doc.querySelectorAll("link[rel*='icon']")
    let itemList = [];

    for (var i = 0; i < nodeList.length; i++) {
      let href = nodeList[i].getAttribute("href")

      if (href.startsWith("./")) {
        href = href.replace("./", "/")
      }

      if (href.startsWith("/")) {
        href = url.concat(href)
      }

      const res = await fetch(href);
      if (res.ok) {
        // Convert the image to a Blob
        const blob = await res.blob();

        // Convert the Blob to a Base64 string
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          const base64data = reader.result;

          itemList.push(base64data);
        }
      }
    }

    let faviconList = [...new Set(itemList)];

    let link = doc.querySelector("link[rel='icon']") || doc.querySelector("link[rel*='icon']");
    let faviconData;

    if (link) {
      faviconData = link.getAttribute("href");

      if (faviconData.startsWith("./")) {
        faviconData = faviconData.replace("./", "/")
      }

      if (faviconData.startsWith("/")) {
        faviconData = url.concat(faviconData)
      }

    } else {
      link = true
      faviconData = url.concat("/favicon.ico")
    }

    const res = await fetch(faviconData);
    if (res.ok) {
      // Convert the image to a Blob
      const blob = await res.blob();

      // Convert the Blob to a Base64 string using a Promise
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      // Update faviconData with the fetched URL and Base64 image
      faviconData = base64data
    }

    if (faviconList.length < 1) faviconList = [faviconData]

    return response, {
      status: status,
      data: { doc, title, link, faviconData, faviconList }
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
      favicons: [],
      favicon: favicon || false
    }

    await this.setState({
      shortcuts: this.state.shortcuts.concat(data)
    })
    const lastShortcut = this.state.shortcuts.length - 1
    this.handleModal()

    try {
      const response = await this.fetchFavicon(url)
      const { title, link, faviconData, faviconList } = response.data

      if (!response.status === 200) {
        throw new Error()
      }

      if (link) {
        const shortcuts = this.state.shortcuts.concat()

        shortcuts.forEach((shortcut, index) => {
          if (index === lastShortcut) {
            shortcut.title = name || title
            shortcut.url = url
            shortcut.favicons = faviconList
            shortcut.favicon = favicon || faviconData
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
    this.dropdown.current.classList.remove("active-dropdown")

    if (name && url === prevUrl && favicon === preFavicon) {
      console.log();
      shortcuts.forEach((shortcut, i) => {
        if (i === index) {
          shortcut.title = name
          shortcut.url = url
          shortcut.favicon = this.state.newFavicon || favicon
        }
        return shortcuts
      })

      this.setState({
        shortcuts: shortcuts
      })

      return
    }

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
      const { title, link, faviconData, faviconList } = response.data

      if (!response.status === 200) {
        throw new Error()
      }

      if (link) {
        let titleName;

        if (name.includes("://")) {
          titleName = title
        }

        else if (name && prevName !== name && url === prevUrl) {
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
            shortcut.favicons = faviconList
            shortcut.favicon = faviconData
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
      alert("There has been a problem with your fetch operation!")
      shortcuts.forEach((shortcut, i) => {
        if (i === index) {
          shortcut.title = url
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

  setFavicon = (event, favicon) => {
    const target = event.currentTarget;
    const faviconElements = target.parentElement.querySelectorAll("div")

    faviconElements.forEach(element => {
      element.classList.remove("active-favicon")
    })

    target.classList.add("active-favicon")

    this.setState({
      newFavicon: favicon
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

  handleMenu = () => {
    this.menu.current.classList.toggle("active-menu")
  }

  handleTheme = (theme) => {
    this.setState({
      theme: theme
    })

    localStorage.setItem("theme", theme)
  }

  applyTheme = () => {
    const themeOverlay = document.querySelector(".theme-overlay")
    const activeTheme = document.querySelector(".active-theme")
    themeOverlay.style.width = activeTheme.offsetWidth + "px"
    themeOverlay.style.height = activeTheme.offsetHeight + "px"
    themeOverlay.style.left = activeTheme.offsetLeft + "px"
    // Get the default theme from the device
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = prefersDarkScheme ? 'dark' : 'light'
    const theme = this.state.theme
    if (theme === "light" || defaultTheme === "light") {
      document.documentElement.style.setProperty('--background-color-0', '#ffffff');
      document.documentElement.style.setProperty('--background-color-1', '#aaaaaa');
      document.documentElement.style.setProperty('--background-color-2', '#505050');
      document.documentElement.style.setProperty('--background-color-3', this.state.color || '#202020');
      document.documentElement.style.setProperty('--background-color-4', '#013d9e');
      document.documentElement.style.setProperty('--background-color-5', '#74a9ff');
      document.documentElement.style.setProperty('--background-color-a', '#e6f5ff');
      document.documentElement.style.setProperty('--background-color-b', '#e1e3e1');
      document.documentElement.style.setProperty('--background-color-c', '#e6f5ff');
      document.documentElement.style.setProperty('--background-color-d', '#505050');
      document.documentElement.style.setProperty('--background-color-e', '#8bb8ff');
      document.documentElement.style.setProperty('--background-color-f', '#ffffff');
      document.documentElement.style.setProperty('--background-color-g', '#4040406c');
      document.documentElement.style.setProperty('--background-color-h', '#9a9a9af2');
      document.documentElement.style.setProperty('--background-color-i', '#0b57d0');
      document.documentElement.style.setProperty('--background-color-j', '#ffffff');
      document.documentElement.style.setProperty('--background-color-k', 'rgba(0, 0, 0, 0.1)');
      document.documentElement.style.setProperty('--background-color-l', 'rgba(30, 30, 30, 0.4)');
      document.documentElement.style.setProperty('--text-color', '#202020');
      // console.log("Theme: Light");
    }
    else if (theme === "dark" || defaultTheme === "dark") {
      document.documentElement.style.setProperty('--background-color-0', '#202020');
      document.documentElement.style.setProperty('--background-color-1', '#808080');
      document.documentElement.style.setProperty('--background-color-2', '#aaaaaa');
      document.documentElement.style.setProperty('--background-color-3', this.state.color || '#ffffff');
      document.documentElement.style.setProperty('--background-color-4', '#80adf6');
      document.documentElement.style.setProperty('--background-color-5', '#045d87');
      document.documentElement.style.setProperty('--background-color-a', '#303030');
      document.documentElement.style.setProperty('--background-color-b', '#252525');
      document.documentElement.style.setProperty('--background-color-c', '#404040');
      document.documentElement.style.setProperty('--background-color-d', '#505050');
      document.documentElement.style.setProperty('--background-color-e', '#046997');
      document.documentElement.style.setProperty('--background-color-f', '#303030');
      document.documentElement.style.setProperty('--background-color-g', '#ffffff6c');
      document.documentElement.style.setProperty('--background-color-h', '#ffffff80');
      document.documentElement.style.setProperty('--background-color-i', '#a8c7fa');
      document.documentElement.style.setProperty('--background-color-j', '#046997');
      document.documentElement.style.setProperty('--background-color-k', 'rgba(255, 255, 255, 0.1)');
      document.documentElement.style.setProperty('--background-color-l', 'rgba(255, 255, 255, 0.4)');
      document.documentElement.style.setProperty('--text-color', '#ffffff');
      // console.log("Theme: Dark");
    }
    // else if (theme === "device") {
    //   console.log(`Theme: Device || ${defaultTheme}`);
    // }
  }

  handleBackground = async () => {
    const file = this.image.current.files[0]

    if (file) {
      // const blobURL = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setState({
          background: e.target.result
        })

        localStorage.setItem("background", e.target.result)

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0, img.width, img.height);

          const imageData = context.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;

          let r, g, b, avg;
          let colorSum = 0;

          for (let x = 0, len = data.length; x < len; x += 4) {
            r = data[x];
            g = data[x + 1];
            b = data[x + 2];

            avg = Math.floor((r + g + b) / 3);
            colorSum += avg;
          }

          const brightness = Math.floor(colorSum / (img.width * img.height));

          if (brightness < 128) {
            this.setState({
              color: "#ffffff"
            })

            localStorage.setItem("color", "#ffffff")
          } else {
            this.setState({
              color: "#202020"
            })

            localStorage.setItem("color", "#202020")
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  applyBackground = () => {
    const background = this.state.background
    const overview = this.preview.current
    const preview = overview.querySelector("img")

    if (background) {
      console.log(background);
      preview.src = background
      overview.style.display = "block"
      document.body.style.backgroundImage = `url(${background})`;
    } else {
      preview.src = ""
      overview.style.display = "none"
      document.body.style.backgroundImage = "none";
    }
  }

  removeBackground = () => {
    this.image.current.value = null
    this.setState({
      background: null,
      text: null
    })
    localStorage.removeItem("background")
    localStorage.removeItem("color")
  }

  handleShortcuts = (event) => {
    const isChecked = event.target.checked

    this.setState({
      showShortcuts: `${isChecked}`
    })

    localStorage.setItem("showShortcuts", isChecked)

  }

  showShortcuts = () => {
    const shortcuts = document.querySelector(".container")

    if (this.state.showShortcuts === "false") {

      shortcuts.classList.add("hide")

    } else if (this.state.showShortcuts === "true") {

      shortcuts.classList.remove("hide")
      localStorage.removeItem("showShortcuts")

    }
  }

  clearShortcuts = () => {
    this.setState({
      shortcuts: []
    })
  }

  showStatus = (title, type) => {
    const status = this.status.current.querySelector(".status-title")
    clearTimeout(this.timer)

    if (type === "success") {
      status.style.color = "#00b22f"
    }
    else if (type === "error") {
      status.style.color = "#d83c20"
    }

    status.textContent = title

    this.status.current.classList.add("active-status")

    this.timer = setTimeout(() => {
      this.status.current.classList.remove("active-status")
    }, 3000);
  }

  importSettings = async (event) => {
    const file = event.target.files[0]

    if (file) {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      try {
        const settings = JSON.parse(data);
        const {theme, background, color} = JSON.parse(data);

        if (!settings.shortcuts) {
          throw new Error()
        }

        if (theme) {
          localStorage.setItem("theme", theme)
        } else {
          localStorage.removeItem("theme")
        }

        if (background) {
          localStorage.setItem("background", background)
        } else {
          localStorage.removeItem("background")
        }

        if (color) {
          localStorage.setItem("color", color)
        } else {
          localStorage.removeItem("color")
        }

        await this.setState({ ...settings })
        this.showStatus("Settings imported successfully.", "success")
      } catch (error) {
        this.showStatus("Failed to import file.", "error")
      }

    }

    event.target.value = null
  }

  exportSettings = () => {
    const settings = {
      theme: this.state.theme,
      background: this.state.background,
      color: this.state.color,
      shortcuts: this.state.shortcuts,
    }

    // Convert the object to a JSON string
    const jsonString = JSON.stringify(settings, null, 2); // null and 2 for formatting the JSON string

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chrome_home_settings.json'; // The name of the file to be downloaded

    // Append the link to the body
    document.body.appendChild(a);

    // Programmatically click the link to trigger the download
    a.click();

    // Remove the link from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);
  }

  clearSettings = () => {
    localStorage.removeItem("theme")
    localStorage.removeItem("background")
    localStorage.removeItem("color")
    this.setState({
      theme: "device",
      background: null,
      color: null,
      shortcuts: [],
    })
  }

  executeConfirm = (func) => {
    this.confirm.current.classList.add("active-confirm")
    const confirm = this.confirm.current.querySelector(".confirm-btn")

    confirm.removeEventListener("click", () => { })

    // Remove the previous event listener if it exists
    if (this.currentHandler) {
      confirm.removeEventListener("click", this.currentHandler);
    }

    // Define the new click handler
    this.currentHandler = () => {
      func();
      document.querySelector(".confirm-box").classList.remove("active-confirm");
    };

    // Add the new event listener
    confirm.addEventListener("click", this.currentHandler)

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

  componentDidMount() {
    this.showShortcuts()
    this.applyTheme()
    this.applyBackground()

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
    if (this.state.theme !== prevState.theme || this.state.color !== prevState.color) {
      this.applyTheme()
    }

    if (this.state.background !== prevProps.background) {
      this.applyBackground()
    }

    if (this.state.showShortcuts !== prevState.showShortcuts) {
      this.showShortcuts()
    }

    if (this.state.shortcuts !== prevState.shortcuts) {
      localStorage.setItem("shortcuts", JSON.stringify(this.state.shortcuts))
    }
  }

  render() {

    return (
      <div className='app'>
        {
          /* <div className="nav">
            <iframe src="https://ogs.google.com/u/0/widget/app?bc=1" width={800} height={300}></iframe>
            <iframe src="https://ogs.google.com/u/0/widget/account" width={800} height={300}></iframe>
          </div> */
        }
        <div className={`google-logo ${this.state.theme !== "dark" && "colored"}`}>
          <h1>G</h1>
          <h1>o</h1>
          <h1>o</h1>
          <h1>g</h1>
          <h1>l</h1>
          <h1>e</h1>
        </div>
        <div className="search">
          <FaIcons.FaSearch className="search-icon" />
          <input ref={this.search} type="text" name="search" placeholder="Search Google or type a URL" />
        </div>

        <div className="customize" ref={this.menu}>
          <div className="edit" onClick={this.handleMenu}>
            <MdIcons.MdModeEdit />
          </div>
          <div className="menu">
            <span className="title">
              <MdIcons.MdModeEdit />Customize Homepage
            </span>
            <div className="menu-wrapper">

              <div className="menu-content">
                <span className="content-title">Appearance</span>
                <div className="theme">
                  <div className="theme-overlay"></div>
                  <div className={`theme-btn ${this.state.theme === "light" && "active-theme"}`} onClick={() => this.handleTheme("light")}>
                    <MdIcons.MdOutlineWbSunny className="theme-icon" />
                    <MdIcons.MdOutlineCheck className="theme-check" />
                    <span className="theme-title">Light</span>
                  </div>
                  <div className={`theme-btn ${this.state.theme === "dark" && "active-theme"}`} onClick={() => this.handleTheme("dark")}>
                    <MdIcons.MdOutlineDarkMode className="theme-icon" />
                    <MdIcons.MdOutlineCheck className="theme-check" />
                    <span className="theme-title">Dark</span>
                  </div>
                  <div className={`theme-btn ${this.state.theme === "device" && "active-theme"}`} onClick={() => this.handleTheme("device")}>
                    <MdIcons.MdComputer className="theme-icon" />
                    <MdIcons.MdOutlineCheck className="theme-check" />
                    <span className="theme-title">Device</span>
                  </div>
                </div>
              </div>

              <div className="menu-content">
                <span className="content-title">Background</span>
                <div className="background">
                  <div className="bg-overview" ref={this.preview}>
                    <div className="remove-bg" onClick={this.removeBackground}>
                      <MdIcons.MdClose className="close-icon" />
                    </div>
                    <img src="" alt="preview-bg" />
                  </div>
                  <label className="change-btn">
                    <input type="file" accept="image/*" ref={this.image} onChange={this.handleBackground} />
                    <MdIcons.MdOutlineInsertPhoto className="bg-icon" />
                    <span className="bg-title">Change background</span>
                  </label>
                </div>
              </div>

              <div className="menu-content">
                <span className="content-title">Shortcuts</span>
                <div className="show-shortcut">
                  <span className="sub-title">Show shortcuts</span>
                  <label className="switch">
                    <input type="checkbox" name="checkbox" checked={this.state.showShortcuts === "true" ? true : false} onChange={this.handleShortcuts} />
                    <div className="slider"></div>
                  </label>
                </div>
                <div className="hr"></div>
                <div className="clear-shortcut">
                  <span className="sub-title">Clear shortcuts</span>
                  <button className="clear-btn" onClick={() => this.executeConfirm(this.clearShortcuts)}>
                    <MdIcons.MdDelete className="clear-icon" />
                  </button>
                </div>
              </div>

              <div className="menu-content">
                <span className="content-title">Settings</span>
                <div className="settings">
                  <label className="setting-btn">
                    <input type="file" accept="json/*" onChange={this.importSettings} />
                    <MdIcons.MdOutlineFileDownload className="setting-icon" />
                    <span>Import</span>
                  </label>
                  <button className="setting-btn" onClick={this.exportSettings}>
                    <MdIcons.MdOutlineFileUpload className="setting-icon" />
                    <span>Export</span>
                  </button>
                  <button className="setting-btn" onClick={() => this.executeConfirm(this.clearSettings)}>
                    <MdIcons.MdDeleteForever className="setting-icon" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              <div className="confirm-box" ref={this.confirm}>
                <span className="confirm-title">Are you sure?</span>
                <div className="confirm">
                  <div className="confirm-btn">
                    <button>
                      <MdIcons.MdCheckCircleOutline className="confirm-icon" />
                      <span className="confirm-y">Confirm</span>
                    </button>
                  </div>
                  <div className="confirm-btn" onClick={() => this.confirm.current.classList.remove("active-confirm")}>
                    <button>
                      <MdIcons.MdOutlineCancel className="confirm-icon" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="menu-status" ref={this.status}>
                <span className="status-title"></span>
              </div>

            </div>
          </div>
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
              {
                this.state.favicons.length > 0 &&
                <div className="favicon-box">
                  <span className="f-title">Choose an icon</span>
                  <div className="favicon-icons">
                    {
                      this.state.favicons.map((favicon, index) => {
                        return <div key={index} className={`favicon ${this.state.input.favicon === favicon && "active-favicon"}`} onClick={(event) => this.setFavicon(event, favicon)}>
                          <img src={favicon} alt="" />
                        </div>
                      })
                    }
                  </div>
                </div>
              }
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
          <div className={`shortcuts ${this.state.shortcuts.length < 1 && "center"}`} >
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
                  <Shortcut remove={this.removeShortcut} editModal={this.editModal} index={index} shortcut={shortcut} />
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
