import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent } from '@pymebot/core';

describe('web smoke', () => {
  it('classifies spanish stock query', () => {
    assert.equal(classifyIntent('cuánto stock tengo'), 'product');
  });
});
