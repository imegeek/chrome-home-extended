import { Component } from 'react'
import PropTypes from 'prop-types';
import './css/Spinner.css'

/**
 * Spinner component displays a loading spinner.
 * 
 * @component
 * @prop {number} size - Size of the spinner in pixels.
 * 
 * @example
 * const size = 50;
 * return <Spinner size={size} />;
 */

export default class Spinner extends Component {
	// Default props
	static defaultProps = {
		/**
		 * Default size of the spinner.
		 * @type {number}
		 */
		size: 50
	};

	static propTypes = {
		/**
		 * Size of the spinner in pixels.
		 * @type {number}
		 */
		size: PropTypes.number
	};

	render() {
		return (
			<div className='spinner' style={{
				width: this.props.size + "px",
				height: this.props.size + "px"
			}}></div>
		)
	}
}


