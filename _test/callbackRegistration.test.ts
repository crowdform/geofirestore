import * as firebase from 'firebase';

import { GeoCallbackRegistration } from '../src';
import {
  afterEachHelper, beforeEachHelper, Checklist,
  failTestOnCaughtError, geoFirestore, geoFirestoreQueries, wait
} from './common';

import * as chai from 'chai';

const expect = chai.expect;

describe('GeoFirestore GeoCallbackRegistration Tests:', () => {
  // Reset the Firestore before each test
  beforeEach((done) => {
    beforeEachHelper(done);
  });

  afterEach((done) => {
    afterEachHelper(done);
  });

  describe('Constructor:', () => {
    it('Constructor throws error given non-function', () => {
      const createCallbackRegistration = () => {
        // @ts-ignore 
        new GeoCallbackRegistration('nonFunction'); // tslint:disable-line
      };

      expect(() => createCallbackRegistration()).to.throw(null, 'callback must be a function');
    });
  });

  describe('Cancelling event callbacks:', () => {
    it('\'key_moved\' registrations can be cancelled', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'p5', 'loc1 moved'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyMovedRegistration = geoFirestoreQueries[0].on('key_moved', (key, document, distance) => {
        cl.x(key + ' moved');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0) },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7) },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(1, 1) }
      }).then(() => {
        cl.x('p1');

        return geoFirestore.set('loc1', { coordinates: new firebase.firestore.GeoPoint(2, 2) });
      }).then(() => {
        cl.x('p2');

        return wait(100);
      }).then(() => {
        onKeyMovedRegistration.cancel();
        cl.x('p3');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(1, 2) });
      }).then(() => {
        cl.x('p4');

        return wait(100);
      }).then(() => {
        cl.x('p5');
      }).catch(failTestOnCaughtError);
    });

    it('\'key_modified\' registrations can be cancelled', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'p5', 'loc1 modified'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyModifiedRegistration = geoFirestoreQueries[0].on('key_modified', (key, document, distance) => {
        cl.x(key + ' modified');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0), modified: false },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7), modified: false },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(1, 1), modified: false }
      }).then(() => {
        cl.x('p1');

        return geoFirestore.set('loc1', { coordinates: new firebase.firestore.GeoPoint(0, 0), modified: true });
      }).then(() => {
        cl.x('p2');

        return wait(100);
      }).then(() => {
        onKeyModifiedRegistration.cancel();
        cl.x('p3');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(1, 1), modified: true });
      }).then(() => {
        cl.x('p4');

        return wait(100);
      }).then(() => {
        cl.x('p5');
      }).catch(failTestOnCaughtError);
    });

    it('\'key_entered\' registrations can be cancelled', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'loc1 entered'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyEnteredRegistration = geoFirestoreQueries[0].on('key_entered', (key, document, distance) => {
        cl.x(key + ' entered');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0) },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7) },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(80, 80) }
      }).then(() => {
        cl.x('p1');

        return wait(100);
      }).then(() => {
        onKeyEnteredRegistration.cancel();
        cl.x('p2');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(1, 2) });
      }).then(() => {
        cl.x('p3');

        return wait(100);
      }).then(() => {
        cl.x('p4');
      }).catch(failTestOnCaughtError);
    });

    it('\'key_exited\' registrations can be cancelled', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'p5', 'loc1 exited'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyExitedRegistration = geoFirestoreQueries[0].on('key_exited', (key, document, distance) => {
        cl.x(key + ' exited');
        onKeyExitedRegistration.cancel();
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0) },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7) },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(1, 1) }
      }).then(() => {
        cl.x('p1');

        return geoFirestore.set('loc1', { coordinates: new firebase.firestore.GeoPoint(80, 80) });
      }).then(() => {
        cl.x('p2');

        return wait(100);
      }).then(() => {
        cl.x('p3');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(-80, -80) });
      }).then(() => {
        cl.x('p4');

        return wait(100);
      }).then(() => {
        cl.x('p5');
      }).catch(failTestOnCaughtError);
    });

    it('Cancelling a \'key_moved\' registration does not cancel all \'key_moved\' callbacks', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'p5', 'loc1 moved1', 'loc1 moved2', 'loc3 moved2'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyMovedRegistration1 = geoFirestoreQueries[0].on('key_moved', (key, document, distance) => {
        cl.x(key + ' moved1');
      });
      const onKeyMovedRegistration2 = geoFirestoreQueries[0].on('key_moved', (key, document, distance) => {
        cl.x(key + ' moved2');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0) },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7) },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(1, 1) }
      }).then(() => {
        cl.x('p1');

        return geoFirestore.set('loc1', { coordinates: new firebase.firestore.GeoPoint(2, 2) });
      }).then(() => {
        cl.x('p2');

        return wait(100);
      }).then(() => {
        onKeyMovedRegistration1.cancel();
        cl.x('p3');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(1, 2) });
      }).then(() => {
        cl.x('p4');

        return wait(100);
      }).then(() => {
        cl.x('p5');
      }).catch(failTestOnCaughtError);
    });

    it('Cancelling a \'key_modified\' registration does not cancel all \'key_modified\' callbacks', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'p5', 'loc1 modified1', 'loc1 modified2', 'loc3 modified2'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyModifiedRegistration1 = geoFirestoreQueries[0].on('key_modified', (key, document, distance) => {
        cl.x(key + ' modified1');
      });
      const onKeyModifiedRegistration2 = geoFirestoreQueries[0].on('key_modified', (key, document, distance) => {
        cl.x(key + ' modified2');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0), modified: false },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7), modified: false },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(1, 1), modified: false }
      }).then(() => {
        cl.x('p1');

        return geoFirestore.set('loc1', { coordinates: new firebase.firestore.GeoPoint(0, 0), modified: true });
      }).then(() => {
        cl.x('p2');

        return wait(100);
      }).then(() => {
        onKeyModifiedRegistration1.cancel();
        cl.x('p3');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(1, 1), modified: true });
      }).then(() => {
        cl.x('p4');

        return wait(100);
      }).then(() => {
        cl.x('p5');
      }).catch(failTestOnCaughtError);
    });

    it('Cancelling a \'key_entered\' registration does not cancel all \'key_entered\' callbacks', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'loc1 entered1', 'loc1 entered2', 'loc3 entered2'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyEnteredRegistration1 = geoFirestoreQueries[0].on('key_entered', (key, document, distance) => {
        cl.x(key + ' entered1');
      });
      const onKeyEnteredRegistration2 = geoFirestoreQueries[0].on('key_entered', (key, document, distance) => {
        cl.x(key + ' entered2');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0) },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7) },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(80, 80) }
      }).then(() => {
        cl.x('p1');

        return wait(100);
      }).then(() => {
        onKeyEnteredRegistration1.cancel();
        cl.x('p2');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(1, 2) });
      }).then(() => {
        cl.x('p3');

        return wait(100);
      }).then(() => {
        cl.x('p4');
      }).catch(failTestOnCaughtError);
    });

    it('Cancelling a \'key_exited\' registration does not cancel all \'key_exited\' callbacks', (done) => {
      const cl = new Checklist(['p1', 'p2', 'p3', 'p4', 'p5', 'loc1 exited1', 'loc1 exited2', 'loc3 exited2'], expect, done);

      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyExitedRegistration1 = geoFirestoreQueries[0].on('key_exited', (key, document, distance) => {
        cl.x(key + ' exited1');
      });
      const onKeyExitedRegistration2 = geoFirestoreQueries[0].on('key_exited', (key, document, distance) => {
        cl.x(key + ' exited2');
      });

      geoFirestore.set({
        'loc1': { coordinates: new firebase.firestore.GeoPoint(0, 0) },
        'loc2': { coordinates: new firebase.firestore.GeoPoint(50, -7) },
        'loc3': { coordinates: new firebase.firestore.GeoPoint(1, 1) }
      }).then(() => {
        cl.x('p1');

        return geoFirestore.set('loc1', { coordinates: new firebase.firestore.GeoPoint(80, 80) });
      }).then(() => {
        cl.x('p2');

        return wait(100);
      }).then(() => {
        onKeyExitedRegistration1.cancel();
        cl.x('p3');

        return geoFirestore.set('loc3', { coordinates: new firebase.firestore.GeoPoint(-80, -80) });
      }).then(() => {
        cl.x('p4');

        return wait(100);
      }).then(() => {
        cl.x('p5');
      }).catch(failTestOnCaughtError);
    });

    it('Calling cancel on a GeoCallbackRegistration twice does not throw', () => {
      geoFirestoreQueries.push(geoFirestore.query({ center: new firebase.firestore.GeoPoint(1, 2), radius: 1000 }));

      const onKeyExitedRegistration = geoFirestoreQueries[0].on('key_exited', () => { });

      expect(() => onKeyExitedRegistration.cancel()).not.throw();
      expect(() => onKeyExitedRegistration.cancel()).not.throw();
    });
  });
});
