/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as flags from '../flags';
import * as q from 'q';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';

describe( 'A FlagHandler', () => {

   var scope;
   var flagHandler;
   var disableOnSpy;
   var omitOnSpy;
   var omitOnSpy2;
   var hideOnSpy;
   var neverCalledSpy;

   function publishFlagState( flag, state ) {
      return scope.eventBus.publish( 'didChangeFlag.' + flag + '.' + state, {
         flag: flag,
         state: state
      } );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock(),
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

   it( 'subscribes to the according didChangeFlag events', () => {
      [ 'flagOne', 'flagTwo', 'flagThree', 'flagFour' ].forEach( flagName => {
         expect( scope.eventBus.subscribe )
            .toHaveBeenCalledWith( 'didChangeFlag.' + flagName, jasmine.any( Function ) );
      } );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds the initial states of the flags with their configured modelKey on the scope', () => {
      expect( scope.flags.disabled ).toBe( true );
      expect( scope.flags.omitOn ).toBeUndefined();
      expect( scope.flags.hidden ).toBe( true );
      expect( scope.flags.ignoreOn ).toBeUndefined();
      expect( scope.flags.nothing ).toBe( true );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when flags change', () => {

      beforeEach( done => {
         q.all( [
            publishFlagState( 'flagOne', true ),
            publishFlagState( 'flagTwo', true ),
            publishFlagState( 'flagFour', true ),
         ] )
         .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'changes the states of the flags accordingly', () => {
         expect( scope.flags.disabled ).toBe( true );
         expect( scope.flags.omitOn ).toBeUndefined();
         expect( scope.flags.hidden ).toBe( false );
         expect( scope.flags.ignoreOn ).toBeUndefined();
         expect( scope.flags.nothing ).toBe( true );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the change handler of the flags if necessary', () => {
         expect( disableOnSpy ).not.toHaveBeenCalled();
         expect( omitOnSpy2 ).toHaveBeenCalledWith( true, false );
         expect( omitOnSpy2 ).toHaveBeenCalledWith( true, false);
         expect( hideOnSpy ).toHaveBeenCalledWith( false, true );
         expect( neverCalledSpy ).not.toHaveBeenCalled();
      } );

   } );

} );
