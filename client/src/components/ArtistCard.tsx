import { Card, CardHeader, CardBody, Image } from "@heroui/react";

interface Artist {
  name: string;
  spotifyId?: string;
  spotifyRank?: number;
  spotifyImageURL?: string;
  available?: boolean;
  matchType?: string;
}

const defaultArtist: Artist = {
    name: "N/A",
    spotifyRank: -1,
    spotifyImageURL: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAETCAMAA
ABDSmfhAAAAMFBMVEXd3d3////a2trf39/6+vrl5eXv7+/4+Pjn5+fy8vLe3t7m5ubi4uLs7Oz5+f
n09PQCwX1aAAAFbUlEQVR4nO2c2ZKrMBBDEzNZJ0z+/29vnI0lQAxIcrtunweeVS65F2P3ZuM4
juM4juM4juM4juM4juM4juM4juM4juM4juM4aYTcAuYRQrjs6rreX/e376UKJegP1fH0s+3yt9
/Z1h6qfV/zi8PRrm3qMdEPrjuDysNmPyn6zk9tTnmC6jt1bqFtQp2oOnK0subhMu3rD7dcTCgP
p1mqI9fcmuNiz1Yd+c285LOc3VnyrMLDdaHsm8urfLLP8zZkj2xeOa9RfWOfR/iyHdkmi8nXy7
6ZvEzZGYSv9XYm4SjZYuFhVQDMJjwccLJvwlVRJaQW24mowuEOK1uVgCq07FsvIZAd/vC6t/wi
a3HlOgl/bxJcEmHvTYpLImSLU1xy50zVTZO9PRCdsqIv+w7RKaRN+YQmG1uXfHBiOQXTK4xDyj
7k5aZtTfZyb7c7hmz6cpPSPTeYPCAsODV2v2AsuEA2Y8F5lUkbeEhBtvBToGM4Pwg+2GNlL/gb
shCsUYJKNnhnws8eRoF2bDqbYMtZnU2w/YMqmkSQRtEknSc43YJSsAUuoijtjbwzobQ3skaR2h
tncEnp3eKC0s06FBwBZnCtbNhBinZb4ro18baEbUy5bkzTow4nqICizfIRTEmoaokbMIFQW51E
MM2xXjcmgOt1Yyorddr533UfXbdU92+hun29tbpLjSe4y4KplJovS61PSq0HQbrlfUOp/Q7opx
r4Xul3Cu3nUecn6oSJOq9SJx7U+aC6oUf9cFAHFNgVSG1AwV1C0f0tjgDv40l14368an84wGRr
DY68Y6U0OPLmjLKURf1Nu+sW3uOAXvjRGQV7K1lnFKRNNsKIAr5AqLgdGwHfw5PVVvC765rmAX
91XVOE/6Jla45lGfeoFQtOGesicDjlYQY/pJCm6NBjOOnhEbu6or1Q41YpxEev1LIQXFG1YTqF
+QCTGcS5b7ppP9fIM9A479AFL9FJFiduypdwhsUVIyIIaVMzSwS/N7mP518EdCmumMdxF47t7n
UDuKBXT6mJsi8cd7IsHgVVqGxUNNSPOoPUtLTZCuMgomGWGYTro2GmmY9rG3zKWIUkVoXxDN5+
ss4p2ebfrizFD3WVRfm6caZ3/vTTklFFoVZ5qGCHhdI5z9BCVjXOHN43SCrZufO+k6BnznDmvF
Yj507Wsc9NOHM+G8MifOHoQaZ94STZFfu2Eke44A89Q7jkdQZceBDd7QULh2dIjXCdbGg4VMpG
FrbiB1Oo8lD+zgtzPqt/5oURrpeNEK5/vHNn7eYkl1I04fq3ri9WJSDVbcchVvyJ1U+0aLNctn
zwSYfFP2P1D6K7LJ0wl1n2woyfKXJ3WLI384XAFvNlZyhLBpht8cyx5M3cKwe5Y8mbeSeH+rfn
Y/zNcUq2cmqAOcEwZ13yQbpTLITuhvRTfe070a+kxpS8ZeAAibpNZMo2ae2mnRj4Jmlrysckfi
cl3Rtc7qTC0OByp8RCk8ud0N6bXO7vzabR5f664OZi94vputBcqmyYXHAz7cInUyHFViHYYyKG
m6q7+4wnTeVYggWMr3duZdOMvlE3mnPejBjFcBB8MPLaWz/YcSbDodD4rowMvvMxW5o0DD6cNt
bFDzFUFVo5yZxkIGcWYJPBEG62gu3wYZQibDJklNyK0vgwShk2+YgohdjkwyhFRJNIL/UYbtC6
9GoUQz9GvtC1ifUStqHT15tuLLucCoyCkXYkLCYKRsq0d+c3VUH27qR66418hyaCF9BZtglF2r
tdouRWMo93iVJAR9zm/TC5qG3ZZJ6isk4kFLktm42ZW8dcniWh+fPMPnVxxeCDZ0ApLJy8/mWa
/ok2yCMQFtPKN5z/AZpDb7mUEOhpAAAAAElFTkSuQmCc`
}

export default function ArtistCard(artist: Artist = defaultArtist) {
  return (
    <Card className="py-4 bg-gray-800 rounded-2xl shadow-xl">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <p className="text-tiny text-gray-300 font-bold">#{artist.spotifyRank}</p>
        <h4 className="font-bold text-gray-50 text-lg">{artist.name}</h4>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Artist Image"
          className="object-cover rounded-xl"
          src={artist.spotifyImageURL}
        />
      </CardBody>
    </Card>
  );
}