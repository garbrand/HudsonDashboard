expect = require('chai').expect
Build  = require('../js/build.js')

describe('Build spec:', ->
	describe('Getting Build information', ->
		it('should fail when you do not pass a project', ->
			expect( Build ).to.throw(Error)
		)
		it('should get the complete build information from the CI', ->
			build = new Build('mock')
		)
	)
)