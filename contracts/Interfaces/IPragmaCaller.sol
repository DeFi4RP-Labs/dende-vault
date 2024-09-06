// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPragmaCaller {
    enum DataType {
        SpotEntry,
        FuturesEntry,
        GenericEntry
    }

    struct DataRequest {
        DataType dataType;
        uint256 pairId;
        uint256 expirationTimestamp;
    }

    struct PragmaPricesResponse {
        uint256 price;
        uint256 decimals;
        uint256 last_updated_timestamp;
        uint256 num_sources_aggregated;
        uint256 maybe_expiration_timestamp;
    }

    function getDataMedianSpot(DataRequest memory request) external view returns (PragmaPricesResponse memory);
}
