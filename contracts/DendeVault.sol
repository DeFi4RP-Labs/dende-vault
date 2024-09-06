// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./DendeFees.sol";
import "./Interfaces/IPragmaCaller.sol";

// mpEth 0x819845b60a192167ed1139040b4f8eca31834f27
contract DendeVault is DendeFees {

    // a mapping that checks if a user has deposited the token
    mapping(address => uint256) public shareHolder;
    address payable public vaultOwner;
    uint256 public exitFeeBasisPoints; //150 for 1.5%

    IPragmaCaller private pragmaCaller;
    // ascii conversion of "ETH/USD";
    uint256 constant ETH_USD_FEED = 19514442401534788;
    address constant pragmaCallerAddress = 0x7491cA3699701a187C1a17308338Ad0bA258B082; //KRT Sepolia

    event BuyStrategy(uint256 chainId, address crossAsset, uint256 amount);
    event DepositStrategy(address indexed strategyContract, uint256 amount);
    event WithdrawStrategy(address indexed strategyContract, uint256 amount);

    constructor(IERC20 _asset, uint _basisPoints) ERC4626 (_asset) ERC20("Dende MetaPool ETH", "dndMpETH"){
        vaultOwner = payable(msg.sender);
        exitFeeBasisPoints = _basisPoints;
        pragmaCaller = IPragmaCaller(pragmaCallerAddress);
    }

     function getDataMedianSpot() public view returns (IPragmaCaller.PragmaPricesResponse memory) {
        IPragmaCaller.DataRequest memory request = IPragmaCaller.DataRequest(
            IPragmaCaller.DataType.SpotEntry,
            ETH_USD_FEED,
            0
        );
        return pragmaCaller.getDataMedianSpot(request);
    }
    
    /**
        * @notice function to deposit assets and receive vault token in exchange
        * @param _assets amount of the asset token
        * @param chainId chain id of the asset exist
        * @param crossAsset address of the asset on the chain
    */
    function _deposit(uint _assets, uint chainId, address crossAsset) public returns (uint256){
        // checks that the deposited amount is greater than zero.
        require(_assets > 0, "Deposit less than Zero");
        uint assetPrice = beforeDeposit();
        // calling the deposit function ERC-4626 library to perform all the functionality
        uint shares = deposit(((_assets/assetPrice)*100000000), msg.sender);
        // Send to the simple strategy like deposit on lending protocol to generate extra yield
        afterDeposit(_assets);
        // Increase the share of the user
        shareHolder[msg.sender] += shares;
        emit BuyStrategy(chainId, crossAsset, shares);
        return shares;
    }

    /**
        * @notice Function to allow msg.sender to withdraw their deposit plus accrued interest
        * @param _shares amount of shares the user wants to convert
        * @param _receiver address of the user who will receive the assets
    */
    function _withdraw(uint _shares, address _receiver) public {
        // checks that the deposited amount is greater than zero.
        require(_shares > 0, "withdraw must be greater than Zero");
        // Checks that the _receiver address is not zero.
        require(_receiver != address(0), "Zero Address");
        // checks that the caller is a shareholder
        require(shareHolder[msg.sender] > 0, "Not a shareHolder");
        // checks that the caller has more shares than they are trying to withdraw.
        require(shareHolder[msg.sender] >= _shares, "Not enough shares");
        // Calculate 10% yield on the withdraw amount
        uint256 percent = (10 * _shares) / 100;
        // Calculate the total asset amount as the sum of the share amount plus 10% of the share amount.
        uint256 assets = previewRedeem(_shares + percent);
        // calling the redeem function from the ERC-4626 library to perform all the necessary functionality
        redeem(assets, _receiver, msg.sender);
        // Decrease the share of the user
        shareHolder[msg.sender] -= _shares;
    }

    function _exitFeeBasisPoints() internal view override returns (uint256) {
        return exitFeeBasisPoints;
    }

    function _exitFeeRecipient() internal view override returns (address) {
        return vaultOwner;
    }
    
    /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/
    function beforeDeposit() internal virtual returns (uint256) {
        // check the price of the asset from the oracle to calculate the number of shares
        IPragmaCaller.PragmaPricesResponse memory response = getDataMedianSpot();
        return response.price;
    }

    function afterDeposit(uint256 assets) internal virtual {
        // deposit the assets to the lending protocol
    }
    
    function beforeWithdraw(uint256 assets, uint256 shares) internal virtual {
        // withdraw the assets from the lending protocol and calculate the yield
    }
}
