'use babel';

import abbreviation from './abbreviation';
import math from './math';

export default function getProviders() {
	return [ abbreviation('*'), math('*') ];
}
