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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'still returns a resolved promise (#88)', done => {
         const promise = publisher( true );

         expect( typeof promise.then ).toEqual( 'function' );
         promise.then( done, done.fail );
      } );

   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A FlagHandler', () => {

   let context;
   let disableOnSpy;
   let omitOnSpy2;
   let omitOnSpy3;
   let hideOnSpy;
   let neverCalledSpy;

   function publishFlagState( flag, state ) {
      return context.eventBus.publish( `didChangeFlag.${flag}.${state}`, { flag, state } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      context = {
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

      flags.handlerFor( context )
         .registerFlagFromFeature( 'superFeature.superAttribute.disableOn', {
            contextKey: 'flags.disabled',
            onChange: disableOnSpy
         } )
         .registerFlag( context.features.superFeature.superAttribute.omitOn, {
            predicate: 'all',
            onChange: [ omitOnSpy, omitOnSpy2 ]
         } )
         .registerFlag( context.features.superFeature.superAttribute.omitOn, omitOnSpy3 )
         .registerFlagFromFeature( 'superFeature.superAttribute.hideOn', {
            contextKey: 'flags.hidden',
            onChange: hideOnSpy
         } )
         .registerFlag( context.features.superFeature.superAttribute.ignoreOn, {
            onChange: neverCalledSpy
         } )
         .registerFlagFromFeature( 'superFeature.superAttribute.nothingOn', {
            contextKey: 'flags.nothing',
            initialState: true,
            onChange: neverCalledSpy
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to the corresponding didChangeFlag events', () => {
      [ 'flagOne', 'flagTwo', 'flagThree', 'flagFour' ].forEach( flagName => {
         expect( context.eventBus.subscribe )
            .toHaveBeenCalledWith( `didChangeFlag.${flagName}`, jasmine.any( Function ) );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds the initial states of the flags with their configured modelKey on the context', () => {
      expect( context.flags.disabled ).toBe( true );
      expect( context.flags.omitOn ).toBeUndefined();
      expect( context.flags.hidden ).toBe( true );
      expect( context.flags.ignoreOn ).toBeUndefined();
      expect( context.flags.nothing ).toBe( true );
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
         expect( context.flags.disabled ).toBe( true );
         expect( context.flags.omitOn ).toBeUndefined();
         expect( context.flags.hidden ).toBe( false );
         expect( context.flags.ignoreOn ).toBeUndefined();
         expect( context.flags.nothing ).toBe( true );
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
