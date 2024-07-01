import * as FaIcons from "react-icons/fa";
import { Component } from 'react'
import './css/Search.css'

export default class Search extends Component {
	render() {
		return (
			<div className="search">
				<FaIcons.FaSearch className="search-icon" />
				<input ref={this.props.reference} type="text" name="search" placeholder="Search Google or type a URL" />
			</div>
		)
	}
}
