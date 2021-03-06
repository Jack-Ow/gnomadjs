import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { actions as variantActions } from '@broad/redux-variants'
import { Loading } from '@broad/ui'

import { actions as geneActions } from './genes'


const GenePageContainer = ComposedComponent => class GenePage extends Component {
  static propTypes = {
    fetchGeneData: PropTypes.func.isRequired,
    geneName: PropTypes.string.isRequired,
    transcriptId: PropTypes.string,
  }

  static defaultProps = {
    transcriptId: undefined,
  }

  state = {
    geneData: null,
    isLoading: false,
    loadError: null,
  }

  componentDidMount() {
    this.mounted = true
    this.loadGeneData()
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.geneName !== prevProps.geneName
      || this.props.transcriptId !== prevProps.transcriptId
    ) {
      this.loadGeneData()
    }
  }

  componentWillUnmount() {
    this.mounted = false
  }

  loadGeneData() {
    this.setState({
      isLoading: true,
      loadError: null,
    })

    this.props.fetchGeneData(this.props.geneName, this.props.transcriptId)
      .then((geneData) => {
        let loadError = null
        if (!geneData) {
          loadError = 'Gene not found'
        }
        if (
          this.props.transcriptId
          && !geneData.transcripts.map(t => t.transcript_id).includes(this.props.transcriptId)
        ) {
          loadError = 'Transcript not found'
        }
        if (!this.mounted) {
          return
        }
        this.setState({
          geneData,
          isLoading: false,
          loadError,
        })
      })
      .catch(() => {
        if (!this.mounted) {
          return
        }
        this.setState({
          geneData: null,
          isLoading: false,
          loadError: 'Unable to load gene data'
        })
      })
  }

  render() {
    if (this.state.isLoading) {
      return (
        <Loading>
          <h1>Loading...</h1>
        </Loading>
      )
    }

    if (this.state.loadError) {
      return (
        <Loading>
          <h1>{this.state.loadError}</h1>
        </Loading>
      )
    }

    if (this.state.geneData) {
      return (
        <ComposedComponent gene={this.state.geneData} />
      )
    }

    return null
  }
}


const mapDispatchToProps = geneFetchFunction => dispatch => ({
  fetchGeneData(geneName, transcriptId) {
    return dispatch(thunkDispatch => {
      thunkDispatch(geneActions.setCurrentGene(geneName))
      thunkDispatch(geneActions.setCurrentTranscript(transcriptId))

      thunkDispatch(geneActions.requestGeneData(geneName))
      return geneFetchFunction(geneName, transcriptId).then(geneData => {
        thunkDispatch(geneActions.receiveGeneData(geneName, geneData))

        // Reset variant filters when loading a new gene
        thunkDispatch(variantActions.searchVariants(''))
        thunkDispatch(
          variantActions.setVariantFilter({
            lof: true,
            missense: true,
            synonymous: true,
            other: true,
          })
        )

        return geneData
      })
    })
  },
})


const GenePageHOC = (
  ComposedComponent,
  geneFetchFunction
) => connect(
  null,
  mapDispatchToProps(geneFetchFunction)
)(GenePageContainer(ComposedComponent))

export default GenePageHOC
