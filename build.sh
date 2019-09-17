VERSION=$1

echo "Building TumTaster $VERSION"

cd src
zip ../TumTaster-$VERSION.zip ./* -r -9
cd ..
