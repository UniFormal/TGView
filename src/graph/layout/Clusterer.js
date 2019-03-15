"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Base_1 = require("./Base");
var Clusterer = /** @class */ (function (_super) {
    __extends(Clusterer, _super);
    function Clusterer(nodes, edges, loggerIn) {
        return _super.call(this, nodes, edges, loggerIn) || this;
    }
    Clusterer.prototype.cluster = function (populationSize, rounds, iterationsPerMutation, finalIterations) {
        if (populationSize === void 0) { populationSize = 10; }
        if (rounds === void 0) { rounds = 10; }
        if (iterationsPerMutation === void 0) { iterationsPerMutation = 200; }
        if (finalIterations === void 0) { finalIterations = 1000; }
        var memberships = [];
        for (var i = 0; i < populationSize; i++) {
            memberships.push({ 'data': [], 'modularity': 0 });
            memberships[i].data = this.generateRandomSolution();
            memberships[i].modularity = this.calculateModularity(memberships[i].data);
        }
        for (var round = 0; round < rounds; round++) {
            console.log('round: ' + round + '/' + rounds);
            for (var i = 1; i < populationSize; i++) {
                for (var j = 0; j < iterationsPerMutation; j++) {
                    if (Math.random() < 0.95) {
                        var nodeIdx = Math.floor(Math.random() * this.myAllNodes.length);
                        memberships[i].modularity = this.findBestNewClusterForNode(nodeIdx, memberships[i].data, memberships[i].modularity);
                    }
                    else {
                        var nodeIdx = Math.floor(Math.random() * this.myAllNodes.length);
                        var randomCluster = Math.floor(Math.random() * this.myAllNodes.length);
                        memberships[i].modularity = this.calculateModularityChangeOneNode(nodeIdx, memberships[i].data, randomCluster, memberships[i].modularity);
                    }
                }
            }
            memberships.sort(function (membership1, membership2) {
                return membership2.modularity - membership1.modularity;
            });
            console.log(memberships[0].modularity);
            console.log(memberships[1].modularity);
            console.log(memberships[2].modularity);
            console.log(' ');
            for (var i = (populationSize / 2) | 0; i < populationSize; i++) {
                var rand1 = Math.floor(Math.random() * ((memberships.length >> 1) - 1));
                var rand2 = Math.floor(Math.random() * ((memberships.length >> 1) - 1));
                if (Math.random() < 0.75) {
                    memberships[i].data = this.combineTwoSolutionsRandom(memberships[rand1].data, memberships[rand2].data);
                    memberships[i].modularity = this.calculateModularity(memberships[i].data);
                }
                else {
                    memberships[i].data = this.combineTwoSolutionsClusterbased(memberships[rand1].data, memberships[rand2].data);
                    memberships[i].modularity = this.calculateModularity(memberships[i].data);
                }
            }
        }
        for (var i = 0; i < populationSize; i++) {
            for (var j = 0; j < finalIterations; j++) {
                var nodeIdx = Math.floor(Math.random() * this.myAllNodes.length);
                memberships[i].modularity = this.findBestNewClusterForNode(nodeIdx, memberships[i].data, memberships[i].modularity);
            }
        }
        memberships.sort(function (membership1, membership2) {
            return membership2.modularity - membership1.modularity;
        });
        console.log(memberships[0].modularity);
        console.log(memberships[1].modularity);
        console.log(memberships[2].modularity);
        return memberships[0].data;
    };
    Clusterer.prototype.combineTwoSolutionsRandom = function (membership1, membership2) {
        var newMembership = [];
        for (var i = 0; i < membership1.length; i++) {
            if (Math.random() < 0.5) {
                newMembership.push(membership1[i]);
            }
            else {
                newMembership.push(membership2[i]);
            }
        }
        return newMembership;
    };
    Clusterer.prototype.combineTwoSolutionsClusterbased = function (membership1, membership2) {
        var newMembership = [];
        // var randNum=Math.random();
        var maxMember1Cluster = 0;
        for (var i = 0; i < membership1.length; i++) {
            newMembership.push(membership1[i]);
            maxMember1Cluster = Math.max(maxMember1Cluster, membership1[i]);
        }
        maxMember1Cluster++;
        var allClusterUsing = [];
        var clusterUsed = [];
        for (var i = 0; i < membership2.length; i++) {
            if (typeof clusterUsed[membership2[i]] !== 'undefined') {
                continue;
            }
            clusterUsed[membership2[i]] = 1;
            if (Math.random() < 0.1) {
                allClusterUsing[membership2[i]] = 1;
            }
        }
        for (var i = 0; i < membership2.length; i++) {
            if (typeof allClusterUsing[membership2[i]] !== 'undefined') {
                newMembership[i] = membership2[i] + maxMember1Cluster;
            }
        }
        return newMembership;
    };
    Clusterer.prototype.generateRandomSolution = function () {
        var membership = [];
        if (Math.random() < 0.75) {
            for (var i = 0; i < this.myAllNodes.length; i++) {
                membership[i] = i;
            }
            return membership;
        }
        for (var i = 0; i < this.myAllNodes.length; i++) {
            membership[i] = -1;
        }
        for (var i = 0; i < this.myAllNodes.length; i++) {
            if (membership[i] != -1) {
                continue;
            }
            var membershipCurr = i + this.myAllNodes.length;
            membership[i] = membershipCurr;
            for (var j = 0; j < this.myAllNodes[i].connectedNodes.length; j++) {
                if ((Math.random() < 0.5 || this.myAllNodes[i].connectedNodes.length < 3)) {
                    membership[this.myAllNodes[i].connectedNodes[j].idx] = membershipCurr;
                }
            }
        }
        for (var i = 0; i < this.myAllNodes.length; i++) {
            if (membership[i] == -1) {
                membership[i] = i;
            }
        }
        return membership;
    };
    Clusterer.prototype.findBestNewClusterForNode = function (nodeIdx, membershipIn, oldModularity) {
        var clusterUsed = [];
        var maxModularity = -Infinity;
        var membershipBest = 0;
        var originalCluster = membershipIn[nodeIdx];
        var membership = membershipIn.slice();
        for (var i = 0; i < membershipIn.length; i++) {
            if (typeof clusterUsed[membershipIn[i]] !== 'undefined') {
                continue;
            }
            clusterUsed[membershipIn[i]] = 1;
            var newCluster = membershipIn[i];
            var modularity = this.calculateModularityChangeOneNode(nodeIdx, membership, newCluster, oldModularity);
            membership[nodeIdx] = originalCluster;
            if (modularity > maxModularity) {
                maxModularity = modularity;
                membershipBest = newCluster;
            }
        }
        //modularity=calculateModularityChangeOneNode(nodeIdx, membershipIn, membershipBest, oldModularity);
        membershipIn[nodeIdx] = membershipBest;
        return maxModularity;
    };
    Clusterer.prototype.calculateModularityChangeOneNode = function (nodeIdx, membership, newCluster, oldModularity) {
        var numberOfLinks2 = this.edgesCount * 2;
        for (var i = 0; i < this.myAllNodes.length; i++) {
            if (membership[nodeIdx] == membership[i] && nodeIdx != i) {
                var isConnected = (typeof this.myAllNodes[nodeIdx].connectedNodesById[this.myAllNodes[i].id] === 'undefined' ? 0 : 1);
                var tmp = isConnected - this.myAllNodes[nodeIdx].connectedNodes.length * this.myAllNodes[i].connectedNodes.length / numberOfLinks2;
                oldModularity -= tmp;
            }
        }
        for (var i = 0; i < this.myAllNodes.length; i++) {
            if (membership[i] == membership[nodeIdx] && nodeIdx != i) {
                var isConnected = (typeof this.myAllNodes[i].connectedNodesById[this.myAllNodes[nodeIdx].id] === 'undefined' ? 0 : 1);
                var tmp = isConnected - this.myAllNodes[i].connectedNodes.length * this.myAllNodes[nodeIdx].connectedNodes.length / numberOfLinks2;
                oldModularity -= tmp;
            }
        }
        membership[nodeIdx] = newCluster;
        for (var i = 0; i < this.myAllNodes.length; i++) {
            if (membership[nodeIdx] == membership[i] && nodeIdx != i) {
                var isConnected = (typeof this.myAllNodes[nodeIdx].connectedNodesById[this.myAllNodes[i].id] === 'undefined' ? 0 : 1);
                var tmp = isConnected - this.myAllNodes[nodeIdx].connectedNodes.length * this.myAllNodes[i].connectedNodes.length / numberOfLinks2;
                oldModularity += tmp;
            }
        }
        for (var i = 0; i < this.myAllNodes.length; i++) {
            if (membership[i] == membership[nodeIdx] && nodeIdx != i) {
                var isConnected = (typeof this.myAllNodes[i].connectedNodesById[this.myAllNodes[nodeIdx].id] === 'undefined' ? 0 : 1);
                var tmp = isConnected - this.myAllNodes[i].connectedNodes.length * this.myAllNodes[nodeIdx].connectedNodes.length / numberOfLinks2;
                oldModularity += tmp;
            }
        }
        return oldModularity;
    };
    Clusterer.prototype.calculateModularity = function (membership) {
        var modularity = 0;
        var numberOfLinks2 = this.edgesCount * 2;
        for (var i = 0; i < this.myAllNodes.length; i++) {
            for (var j = 0; j < this.myAllNodes.length; j++) {
                if (membership[i] == membership[j] && i != j) {
                    var isConnected = (typeof this.myAllNodes[i].connectedNodesById[this.myAllNodes[j].id] === 'undefined' ? 0 : 1);
                    //console.log("isConnected "+isConnected);
                    //console.log(myAllNodes[i]);
                    var tmp = isConnected - this.myAllNodes[i].connectedNodes.length * this.myAllNodes[j].connectedNodes.length / numberOfLinks2;
                    modularity += tmp;
                }
            }
        }
        return modularity;
    };
    return Clusterer;
}(Base_1["default"]));
exports["default"] = Clusterer;
