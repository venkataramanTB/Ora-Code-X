import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import EditFileParserDialog from './EditFileParserDialog.svelte';

const delimitedParser = {
	id: 'p1',
	name: 'Payroll Q1',
	original_filename: 'payroll.csv',
	file_extension: 'csv',
	parse_type: 'delimited',
	delimiter_char: ',',
	has_header: true,
	columns: [
		{ name: 'EmpId', data_type: 'String', position: 1 },
		{ name: 'Amount', data_type: 'Decimal', position: 2 },
	],
};

const txtFixedParser = {
	id: 'p2',
	name: 'Legacy Extract',
	original_filename: 'legacy.txt',
	file_extension: 'txt',
	parse_type: 'fixed_length',
	delimiter_char: null,
	has_header: false,
	columns: [
		{ name: 'Code', data_type: 'String', start_pos: 1, length: 4, trim: true },
	],
};

describe('EditFileParserDialog', () => {
	it('pre-fills name and columns from the parser record', () => {
		const { getByDisplayValue } = render(EditFileParserDialog, {
			props: { parser: delimitedParser, onSave: async () => {}, onClose: () => {} },
		});
		expect(getByDisplayValue('Payroll Q1')).toBeTruthy();
		expect(getByDisplayValue('EmpId')).toBeTruthy();
		expect(getByDisplayValue('Amount')).toBeTruthy();
	});

	it('does not show the parse-type toggle for a non-txt parser', () => {
		const { queryByText } = render(EditFileParserDialog, {
			props: { parser: delimitedParser, onSave: async () => {}, onClose: () => {} },
		});
		expect(queryByText('Fixed Length')).toBeNull();
	});

	it('shows the parse-type toggle for a txt-origin parser', () => {
		const { getByText } = render(EditFileParserDialog, {
			props: { parser: txtFixedParser, onSave: async () => {}, onClose: () => {} },
		});
		expect(getByText('Delimited')).toBeTruthy();
		expect(getByText('Fixed Length')).toBeTruthy();
	});

	it('resets columns when switching parse type on a txt-origin parser', async () => {
		const { getByText, queryByDisplayValue } = render(EditFileParserDialog, {
			props: { parser: txtFixedParser, onSave: async () => {}, onClose: () => {} },
		});
		expect(queryByDisplayValue('Code')).toBeTruthy();
		await fireEvent.click(getByText('Delimited'));
		expect(queryByDisplayValue('Code')).toBeNull();
	});

	it('calls onSave with a payload matching the ParserUpdate shape', async () => {
		/** @type {any} */
		let saved = null;
		const { getByText } = render(EditFileParserDialog, {
			props: {
				parser: delimitedParser,
				onSave: async (payload) => { saved = payload; },
				onClose: () => {},
			},
		});
		await fireEvent.click(getByText('Save Changes'));
		expect(saved).toEqual({
			name: 'Payroll Q1',
			parse_type: 'delimited',
			delimiter_char: ',',
			has_header: true,
			columns: [
				{ name: 'EmpId',  data_type: 'String',  position: 1, start_pos: undefined, length: undefined, trim: undefined },
				{ name: 'Amount', data_type: 'Decimal', position: 2, start_pos: undefined, length: undefined, trim: undefined },
			],
		});
	});

	it('calls onClose when Cancel is clicked', async () => {
		let closed = false;
		const { getByText } = render(EditFileParserDialog, {
			props: { parser: delimitedParser, onSave: async () => {}, onClose: () => { closed = true; } },
		});
		await fireEvent.click(getByText('Cancel'));
		expect(closed).toBe(true);
	});
});
