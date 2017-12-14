import { avroHelperFactory } from './../../lib/avro/avro-helper-factory';
import * as amberAlert from '../../../data/cap/examples/example_amber_alert.json';
import * as earthquakeAlert from '../../../data/cap/examples/example_earthquake.json';
import * as thunderstormAlert from '../../../data/cap/examples/example_thunderstorm.json';
import * as homelandSecurityAlert from '../../../data/cap/examples/example_homeland_security.json';

describe('AVRO Helper Factory', () => {

  it('should throw when there is no schema file', () => {
    const foo = () => avroHelperFactory('');
    expect(foo).toThrow();
  });

  it('should validate messages', () => {
    const avro = avroHelperFactory('./data/cap/cap.avsc', 'driver.eu.alert');
    expect(avro.validate).toBeDefined();
    const aa = avro.validate(amberAlert);
    expect(aa).toBeTruthy();
    const ea = avro.validate(earthquakeAlert);
    expect(ea).toBeTruthy();
    const ta = avro.validate(thunderstormAlert);
    expect(ta).toBeTruthy();
    const ha = avro.validate(homelandSecurityAlert);
    expect(ha).toBeTruthy();
  });

  it('should encode and decode messages', () => {
    const avro = avroHelperFactory('./data/cap/cap.avsc', 'driver.eu.alert');
    expect(avro.encode).toBeDefined();
    expect(avro.decode).toBeDefined();
    const aa = avro.encode(amberAlert);
    expect(aa).toBeTruthy();
    const aad = avro.decode(aa);
    expect(avro.toString(aad)).toEqual(JSON.stringify(amberAlert));
    const ae = avro.encode(earthquakeAlert);
    expect(ae).toBeTruthy();
    const aed = avro.decode(ae);
    // Default properties are added automatically, and cause the comparison to fail
    delete (aed as any).info.language;
    expect(avro.toString(aed)).toEqual(JSON.stringify(earthquakeAlert));
  });
});