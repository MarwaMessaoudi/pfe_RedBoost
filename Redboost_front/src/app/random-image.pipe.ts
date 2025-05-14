import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'randomImage',
  standalone: true,
})
export class RandomImagePipe implements PipeTransform {

  imageOptions: string[] = [
    'assets/images/bluefolder.png',
    'assets/images/greenfolder.png',
    'assets/images/redfolder.png',
    'assets/images/yellowfolder.png'
  ];

  transform(value: any): string {
    const randomIndex = Math.floor(Math.random() * this.imageOptions.length);
    return this.imageOptions[randomIndex];
  }
}