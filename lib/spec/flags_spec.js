/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import * as flags from '../flags';


describe( 'A flag publisher', () => {

   let publisher;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
         features: {
            someState: {
               flag: 'stateFlag'
            }
         }
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'throws if created with no context', () => {
      expect( () => { flags.publisher( null, 'myFlag' ); } ).toThrow();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'throws if created with no valid flag name', () => {
      expect( () => flags.publisher( context ) ).toThrow();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'created with a flag name', () => {

      beforeEach( () => {
         publisher = flags.publisher( context, 'myFlag' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes the given state on the event bus', () => {
         publisher( true );
         expect( context.eventBus.publish )
            .toHaveBeenCalledWith( 'didChangeFlag.myFlag.true', {
               flag: 'myFlag',
               state: true
            } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'created for a feature path', () => {

      beforeEach( () => {
         publisher = flags.publisherForFeature( context, 'someState.flag' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes the given state on the event bus', () => {
         publisher( true );
         expect( context.eventBus.publish )
            .toHaveBeenCalledWith( 'didChangeFlag.stateFlag.true', {
               flag: 'stateFlag',
               state: true
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'throws if that feature path is not configured', () => {
         expect( () => { flags.publisherForFeature( context, 'unknownState.flag' ); } )
            .toThrow( new Error(
               'Assertion error: Code should be unreachable! ' +
               'Details: No configuration found for non-optional flag at feature unknownState.flag.'
            ) );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'created for a non-existent, optional feature path', () => {

      beforeEach( () => {
         publisher = flags.publisherForFeature( context, 'unknownState.flag', { optional: true } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'doesn\'t publish anything on the eventBus when called', () => {
         publisher( true );
         expect( context.eventBus.publish ).not.toHaveBeenCalled();
      } );

   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A FlagHandler', () => {

   let scope;
   let disableOnSpy;
   let omitOnSpy2;
   let omitOnSpy3;
   let hideOnSpy;
   let neverCalledSpy;

   function publishFlagState( flag, state ) {
      return scope.eventBus.publish( `didChangeFlag.${flag}.${state}`, { flag, state } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
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
      const omitOnSpy = jasmine.createSpy( 'omitOnSpy' );
      omitOnSpy2 = jasmine.createSpy( 'omitOnSpy2' );
      omitOnSpy3 = jasmine.createSpy( 'omitOnSpy3' );
      hideOnSpy = jasmine.createSpy( 'hideOnSpy' );
      neverCalledSpy = jasmine.createSpy( 'neverCalledSpy' );

      flags.handlerFor( scope )
         .registerFlagFromFeature( 'superFeature.superAttribute.disableOn', {
            scopeKey: 'flags.disabled',
            onChange: disableOnSpy
         } )
         .registerFlag( scope.features.superFeature.superAttribute.omitOn, {
            predicate: 'all',
            onChange: [ omitOnSpy, omitOnSpy2 ]
         } )
         .registerFlag( scope.features.superFeature.superAttribute.omitOn, omitOnSpy3 )
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to the corresponding didChangeFlag events', () => {
      [ 'flagOne', 'flagTwo', 'flagThree', 'flagFour' ].forEach( flagName => {
         expect( scope.eventBus.subscribe )
            .toHaveBeenCalledWith( `didChangeFlag.${flagName}`, jasmine.any( Function ) );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds the initial states of the flags with their configured modelKey on the scope', () => {
      expect( scope.flags.disabled ).toBe( true );
      expect( scope.flags.omitOn ).toBeUndefined();
      expect( scope.flags.hidden ).toBe( true );
      expect( scope.flags.ignoreOn ).toBeUndefined();
      expect( scope.flags.nothing ).toBe( true );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when flags change', () => {

      beforeEach( done => {
         Promise.all( [
            publishFlagState( 'flagOne', true ),
            publishFlagState( 'flagTwo', true ),
            publishFlagState( 'flagFour', true )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'changes the states of the flags accordingly', () => {
         expect( scope.flags.disabled ).toBe( true );
         expect( scope.flags.omitOn ).toBeUndefined();
         expect( scope.flags.hidden ).toBe( false );
         expect( scope.flags.ignoreOn ).toBeUndefined();
         expect( scope.flags.nothing ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the change handler of the flags if necessary', () => {
         expect( disableOnSpy ).not.toHaveBeenCalled();
         expect( omitOnSpy2 ).toHaveBeenCalledWith( true, false );
         expect( omitOnSpy2 ).toHaveBeenCalledWith( true, false );
         expect( omitOnSpy3 ).toHaveBeenCalledWith( true, false );
         expect( hideOnSpy ).toHaveBeenCalledWith( false, true );
         expect( neverCalledSpy ).not.toHaveBeenCalled();
      } );

   } );

} );
