const { after, afterEach, before, beforeEach, describe, it } = require("mocha");
const {expect} = require("chai");
const rewire = require("rewire");
const MockFoxyRequests = require("../../MockFoxyRequests.js");


const chaiHttp = require('chai-http');
const IdevAffiliate = rewire('../../../src/functions/idevaffiliate-marketplace/idevaffiliate-marketplace.js');
const config = IdevAffiliate.__get__('config');

let sentRequests = [];
IdevAffiliate.__set__('fetch', function () {
  sentRequests.push(arguments);
});

describe("Idev Affiliate", function() {

  before(
    function () {
      config.foxy.api.clientId = 'foo';
    }
  );

  beforeEach(
    function () {
      sentRequests = [];
    }
  );

  it ("Should validate requests", async function () {
    const response = await IdevAffiliate.handler({});
    expect(response.statusCode).to.equal(400);
    expect(JSON.parse(response.body).details).to.equal("Payload is not valid JSON.");
  });

  it ("Should inform of unsupported evets", async function () {
    const request = MockFoxyRequests.validRequest();
    request.headers['foxy-webhook-event'] = 'validation/payment';
    const response = await IdevAffiliate.handler(request);
    expect(response.statusCode).to.equal(501);
    expect(JSON.parse(response.body).details).to.equal("Unsupported event.");
  });

  it ("Should send items to Idev Affiliate", async function () {
    const request = MockFoxyRequests.validRequest({
      _embedded: {
        'fx:items': [
          {code: 'foo', name: 'foo', price: 1},
          {code: 'bar', name: 'bar', price: 2},
        ]
      }
    });
    request.headers['foxy-webhook-event'] = 'transaction/created';
    const response = await IdevAffiliate.handler(request);
    expect(sentRequests.map(i => i[1].body)
      .every(i => i.has('affiliate_id') &&
        i.has('idev_saleamt') &&
        i.has('idev_ordernum')
      )).to.be.true;
    expect(response.statusCode).to.equal(200);
  });
  






});
