import * as _ from 'lodash'
import contract from 'truffle-contract'
import config from '../config'

/**
 * Contract wrapper
 */
class ContractWrapper {
  /**
   * Constructor contract wrapper
   * @param web3Wrapper instance
   */
  constructor(web3Wrapper) {
    this._Web3Wrapper = web3Wrapper
  }

  /**
   * Instantiate contract.
   * DEPRECATED use instead of _deployAsync()
   * @param   artifact
   * @param   address    The hex encoded contract Ethereum address
   * @return  The owner's ERC20 token balance in base units.
   */
  _instantiateContractIfExistsAsync = async (artifact, address) => {
    const c = await contract(artifact)

    const providerObj = this._Web3Wrapper.getProvider()

    c.setProvider(providerObj)

    const networkIdIfExists = await this._Web3Wrapper._getNetworkIdIfExistsAsync()



    const artifactNetworkConfigs = _.isUndefined(networkIdIfExists) ?
                                   undefined :
                                   artifact.networks[networkIdIfExists] // TODO fix

    let contractAddress


    if (!_.isUndefined(address)) {
      contractAddress = address
    } else if (!_.isUndefined(artifactNetworkConfigs)) {
      contractAddress = artifactNetworkConfigs.address
    }

    if (!_.isUndefined(contractAddress)) {
      const doesContractExist = await this._Web3Wrapper.doesContractExistAtAddressAsync(contractAddress)

      if (!doesContractExist) {
        throw new Error('ContractDoesNotExist')
      }
    }

    try {
      const contractInstance = _.isUndefined(address)
                              ? await c.deployed()
                              : await c.at(address)

      return contractInstance;
    } catch (err) {
      const errMsg = `${err}`

      if (_.includes(errMsg, 'not been deployed to detected network')) {
        throw new Error('ContractDoesNotExist')
      } else {
        throw new Error('UnhandledError')
      }
    }
  }

  /**
   * Deploy contract.
   * @param   account
   * @param   value
   * @param   json artifact of the contract
   * @param   rest arguments
   * @return  address | err The owner's of the contract
   */
  _deployAsync = async (account, value, artifact, ...args) => {
    if (_.isEmpty(account)) {
      account = this._Web3Wrapper.getAccount(0)
    }

    const MyContract = contract({
      abi: artifact.abi,
      unlinked_binary: artifact.unlinked_binary,
    })

    const provider = await this._Web3Wrapper.getProvider()

    MyContract.setProvider(provider)

    try {
      let contractDeployed = await MyContract.new(
        ...args,
        {
          from: account,
          value: value,
          gas: config.GAS,
        }
      )

      return contractDeployed
    } catch (e) {
      throw new Error(e)
    }
  }
}

export default ContractWrapper
