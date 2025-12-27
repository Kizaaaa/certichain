// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateRegistry {
    struct Certificate {
        bytes32 docHash;
        string storageURI;
        address issuer;
        uint256 issuedAt;
        bool revoked;
    }

    uint256 public certCount;
    mapping(uint256 => Certificate) public certificates;

    event CertificateIssued(
        uint256 indexed certId,
        bytes32 docHash,
        address issuer
    );

    event CertificateRevoked(
        uint256 indexed certId,
        string reason
    );

    modifier onlyIssuer(uint256 certId) {
        require(certificates[certId].issuer == msg.sender, "Not issuer");
        _;
    }

    function issueCertificate(
        bytes32 _docHash,
        string calldata _storageURI
    ) external returns (uint256) {
        certCount++;

        certificates[certCount] = Certificate({
            docHash: _docHash,
            storageURI: _storageURI,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CertificateIssued(certCount, _docHash, msg.sender);
        return certCount;
    }

    function revokeCertificate(
        uint256 certId,
        string calldata reason
    ) external onlyIssuer(certId) {
        certificates[certId].revoked = true;
        emit CertificateRevoked(certId, reason);
    }
}
