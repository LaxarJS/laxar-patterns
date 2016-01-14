/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../flags',
   'laxar/laxar_testing'
], function( flags, ax ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A FlagHandler', function() {

      var scope;
      var flagHandler;
      var disableOnSpy;
      var omitOnSpy;
      var omitOnSpy2;
      var hideOnSpy;
      var neverCalledSpy;

      function publishFlagState( flag, state ) {
         scope.eventBus.publish( 'didChangeFlag.' + flag + '.' + state, {
            flag: flag,
            state: state
         } );
         jasmine.Clock.tick( 0 );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: ax.testing.portalMocks.mockEventBus(),
            features: {
               superFeature: {
                  superAttribute: {
                     disableOn: [ 'flagOne', 'flagTwo', '!flagThree' ],
                     omitOn: [ 'flagTwo', 'flagFour' ],
                     hideOn: '!flagOne',
                     ignoreOn: null,
                     nothingOn: []
                  }
               }
            }
         };

         disableOnSpy = jasmine.createSpy( 'disableOnSpy' );
         omitOnSpy = jasmine.createSpy( 'omitOnSpy' );
         omitOnSpy2 = jasmine.createSpy( 'omitOnSpy2' );
         hideOnSpy = jasmine.createSpy( 'hideOnSpy' );
         neverCalledSpy = jasmine.createSpy( 'neverCalledSpy' );

         flagHandler = flags.handlerFor( scope )
            .registerFlagFromFeature( 'superFeature.superAttribute.disableOn', {
               scopeKey: 'flags.disabled',
               onChange: disableOnSpy
            } )
            .registerFlag( scope.features.superFeature.superAttribute.omitOn, {
               predicate: 'all',
               onChange: [ omitOnSpy, omitOnSpy2 ]
            } )
            .registerFlagFromFeature( 'superFeature.superAttribute.hideOn', {
               scopeKey: 'flags.hidden',
               onChange: hideOnSpy
            } )
            .registerFlag( scope.features.superFeature.superAttribute.ignoreOn, {
               onChange: neverCalledSpy
            } )
            .registerFlagFromFeature( 'superFeature.superAttribute.nothingOn', {
               scopeKey: 'flags.nothing',
               initialState: true,
               onChange: neverCalledSpy
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to the according didChangeFlag events', function() {
         [ 'flagOne', 'flagTwo', 'flagThree', 'flagFour' ].forEach( function( flagName) {
            expect( scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didChangeFlag.' + flagName, jasmine.any( Function ) );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'adds the initial states of the flags with their configured modelKey on the scope', function() {
         expect( scope.flags.disabled ).toBe( true );
         expect( scope.flags.omitOn ).toBeUndefined();
         expect( scope.flags.hidden ).toBe( true );
         expect( scope.flags.ignoreOn ).toBeUndefined();
         expect( scope.flags.nothing ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when flags change', function() {

         beforeEach( function() {
            publishFlagState( 'flagOne', true );
            publishFlagState( 'flagTwo', true );
            publishFlagState( 'flagFour', true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'changes the states of the flags accordingly', function() {
            expect( scope.flags.disabled ).toBe( true );
            expect( scope.flags.omitOn ).toBeUndefined();
            expect( scope.flags.hidden ).toBe( false );
            expect( scope.flags.ignoreOn ).toBeUndefined();
            expect( scope.flags.nothing ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the change handler of the flags if necessary', function() {
            expect( disableOnSpy ).not.toHaveBeenCalled();
            expect( omitOnSpy2 ).toHaveBeenCalledWith( true, false );
            expect( omitOnSpy2 ).toHaveBeenCalledWith( true, false);
            expect( hideOnSpy ).toHaveBeenCalledWith( false, true );
            expect( neverCalledSpy ).not.toHaveBeenCalled();
         } );

      } );

   } );

} );
