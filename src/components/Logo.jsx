import { Component } from 'react'
import './css/Logo.css'

export default class Logo extends Component {
	render() {
		return (
			<div className={`google-logo ${this.props.theme !== "dark" && "colored"}`}>
				<h1>G</h1>
				<h1>o</h1>
				<h1>o</h1>
				<h1>g</h1>
				<h1>l</h1>
				<h1>e</h1>
			</div>
		)
	}
}
