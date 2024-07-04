import { Component } from 'react'
import './css/Toggle.css'

export default class Toggle extends Component {
	render() {
		return (
			<label className="toggle">
				<input type="checkbox" name="checkbox" checked={this.props.checked} onChange={this.props.onChange} />
				<div className="toggle-slider"></div>
			</label>
		)
	}
}
