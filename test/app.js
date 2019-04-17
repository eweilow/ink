/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import test from 'ava';
import { spy } from 'sinon';
import { render, App } from '..';

test('isRawModeSupported should return correctly', t => {
	t.true(App.prototype.isRawModeSupported({ isTTY: true }));
	t.false(App.prototype.isRawModeSupported({ isTTY: false }));
});

test('handleSetRawMode should throw if not TTY', t => {
	const inst = { props: { stdin: { isTTY: false } } };

	const app = new App();
	t.throws(() => app.handleSetRawMode.apply(inst, true));
	t.throws(() => app.handleSetRawMode.apply(inst, false));
});

test('handleSetRawMode should not throw if TTY', t => {
	const inst = { props: { stdin: { isTTY: false, addListener: spy(), resume: spy(), setRawMode: spy() } } };

	const app = new App();
	t.notThrows(() => app.handleSetRawMode.apply(inst, true));
	t.notThrows(() => app.handleSetRawMode.apply(inst, false));
});

