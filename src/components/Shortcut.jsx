import * as FaIcons from "react-icons/fa";
import React, { Component } from 'react'
import './Shortcut.css'

export default class Shortcut extends Component {

	constructor(props) {
		super(props);
		this.shortcut = React.createRef()
		this.menu = React.createRef()
	}

	// handleMenu = () => {
	// 	this.menu.current.classList.toggle("active")
	// }

	componentDidMount() {
		document.addEventListener('click', this.handleClickOutside, true);
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClickOutside, true);
	}

	handleClickInside = () => {
		if (this.menu.current) {
			if (this.menu.current.classList.contains("active")) {
				this.menu.current.classList.remove('active', 'active-menu');
				this.shortcut.current.style.background = null
			} else {
				this.menu.current.classList.add('active', 'active-menu');
				this.shortcut.current.style.background = "rgba(255, 255, 255, 0.05)"
			}
		}
	};

	handleClickOutside = (event) => {
		if (this.menu.current && !this.menu.current.contains(event.target)) {
			this.menu.current.classList.remove('active', 'active-menu');
			this.shortcut.current.style.background = null
		}
	};

	render() {
		const url = this.props.shortcut.url
		let char;

		if (url.includes(".")) {
			let array = url.split(".")
			char = array[array.length - 2].charAt(0).toUpperCase()
		}
		return (
			<div className='shortcut' ref={this.shortcut}>
				<div className="menu" ref={this.menu} onClick={this.handleClickInside}>
					<FaIcons.FaEllipsisV className="option" />
				</div>
				<div className="menu-option">
					<div onClick={() => this.props.fillModal(this.props.shortcut, this.props.index)}>Edit shortcut</div>
					<div onClick={() => this.props.remove(this.props.index)}>Remove</div>
				</div>
				<a href={this.props.shortcut.url} className="logo">
					{
						!this.props.shortcut.favicon ?
							(<div className="char">
								{char}
							</div>) :
							(<img src={this.props.shortcut.favicon} />)
					}
				</a>
				<span className="title">{this.props.shortcut.title}</span>
			</div>
		)
	}
}