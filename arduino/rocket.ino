#include "Wire.h"
#include "I2Cdev.h"
#include "MPU6050.h"
#include "HMC5883L.h"
//ms5611 isn't included in I2cdev, so this is a standalone library
#include "MS5611.h"
#include <SoftwareSerial.h>
#include<Servo.h>

// Define NewSoftSerial TX/RX pins
uint8_t ssRX = 0;
uint8_t ssTX = 1;
SoftwareSerial xbee(ssRX, ssTX);

MPU6050 accelgyro;
HMC5883L magcompass;
MS5611 baropress;
Servo servo;


//accelgyro variables
int16_t ax, ay, az;
int16_t gx, gy, gz;
//magcompass variables
int16_t mx, my, mz;
//baropress variables
double myRealAltitude = 30;


const int buzzerPin = 4;

int servoPin = 11;
int nSwitch = 0;
int nAngle = 0;
static float prevSeaLevelPressure = 900000;
static float prevTemperature = 0;
bool parachuteState = false;

#define LED_PIN 13
bool blinkState = false;

void i2c_scanner(){
  Serial.println ("Scanning Devices ...");
  byte count = 0;
  
  for (byte i = 1; i < 120; i++)
  {
    //Serial.println(i);
    Wire.beginTransmission (i);
    if (Wire.endTransmission () == 0)
      {
      //Serial.println ("Found address: ");
      //Serial.print (i, HEX);
      //Serial.println (")");
      count++;
      delay (1);
      }
  }
  Serial.print ("Found ");
  Serial.print (count, DEC);
  Serial.println (" device(s).");
}

void setup() {
  Wire.begin();

  Serial.begin(38400);
  xbee.begin(38400);

  // initialize device
  Serial.println("Initializing Setup...");
  accelgyro.initialize();
  magcompass.initialize();

  // MS5611 is a little different
  while(!baropress.begin(MS5611_ULTRA_HIGH_RES))
  {
    //when not ms5611 is not found
    Serial.println("MS5611 is Not Found");
    delay(500);
  }

  // Check settings
  checkSettings();


  accelgyro.setI2CBypassEnabled(true);
  delay(10);
  accelgyro.setI2CMasterModeEnabled(false);
  delay(100);

  // verify connection
        Serial.println("Testing Connection...");
  Serial.println(accelgyro.testConnection() ? "MPU6050 Connected" : "MPU6050 Connection failed");
  Serial.println(magcompass.testConnection() ? "HMC5883L Connected" : "HMC5883L Connection failed");

  // wait for command
//  Serial.println(F("waiting: "));
//  while (Serial.available() && Serial.read()); // empty buffer
//  while (!Serial.available());                 // wait for data
//  while (Serial.available() && Serial.read()); // empty buffer again


  i2c_scanner();
        //mastermode status
  Serial.print ("Master Mode status: ");
  Serial.println(accelgyro.getI2CMasterModeEnabled());
  
  Serial.print ("Bypass status: ");
  Serial.println(accelgyro.getI2CBypassEnabled());

  //configure LED
  pinMode(LED_PIN, OUTPUT);
        pinMode(servoPin, OUTPUT);
        pinMode(buzzerPin, OUTPUT);
        servo.attach(servoPin);
}

void checkSettings()
{
  Serial.print("Barometric Sensor Oversampling: ");
  Serial.println(baropress.getOversampling());
}
void loop() {
 if(Serial.available()){
   nSwitch = Serial.read();
  }

  switch(nSwitch)
  {
    case '0':
    nAngle = 0;
    break;
    case'1':
    nAngle = 90;
    break;
    case'2':
    nAngle = 180;
    break;
  }


  

    // read raw accel/gyro measurements from device
    accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    magcompass.getHeading(&mx, &my, &mz);

    // Read true temperature & Pressure
    double realTemperature = baropress.readTemperature();
    double realPressure = baropress.readPressure();

    // Calculate sealevel pressure
    double seaLevelPressure = baropress.getSeaLevel(realPressure, myRealAltitude);

    // these methods (and a few others) are also available
    //accelgyro.getAcceleration(&ax, &ay, &az);
    //accelgyro.getRotation(&gx, &gy, &gz);

    Serial.print("a/g:");
    Serial.print(ax); Serial.print(",");
    Serial.print(ay); Serial.print(",");
    Serial.print(az); Serial.print(",");
    Serial.print(gx); Serial.print(",");
    Serial.print(gy); Serial.print(",");
    Serial.println(gz);
    Serial.print("mag:");
    Serial.print(mx); Serial.print(",");
    Serial.print(my); Serial.print(",");
    Serial.println(mz); 
    Serial.print("bar:");
    Serial.print(realTemperature); Serial.print(",");
    Serial.print(realPressure/100); Serial.print(",");
    Serial.println(seaLevelPressure/100);
    
//    Serial.print("prevSeaLevelPressure"); Serial.println(prevSeaLevelPressure);
//    Serial.print("seaLevelPressure"); Serial.println(seaLevelPressure);   

//    if(seaLevelPressure < prevSeaLevelPressure){
//      if((prevSeaLevelPressure-seaLevelPressure)>100){
//        prevSeaLevelPressure = seaLevelPressure;
//      }
//    }
//    if(seaLevelPressure > prevSeaLevelPressure){
//      if((seaLevelPressure-prevSeaLevelPressure)>200){
//        nAngle = 180;
//        parachuteState = true;
//      }
//    }
    if(realTemperature > prevTemperature){
      if((realTemperature-prevTemperature)>0.15){
        prevTemperature = realTemperature;
      }   
    }
    if(realTemperature < prevTemperature){
      if((prevTemperature-realTemperature)>0.15){
        nAngle = 180;
        parachuteState = true;
      }
    }
    
  servo.write(nAngle);
  if (parachuteState){
    Serial.println("state: parachute triggered");
  }
  
  // blink LED to indicate activity
  blinkState = !blinkState;
  digitalWrite(LED_PIN, blinkState);
  
  if(blinkState){
  digitalWrite(buzzerPin, HIGH);
  }
  
  delay(350);
}