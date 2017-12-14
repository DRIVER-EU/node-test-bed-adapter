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
});