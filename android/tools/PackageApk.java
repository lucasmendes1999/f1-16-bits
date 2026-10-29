import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

/** Writes consistent stored entries; resources.arsc must be stored on Android 11+. */
public final class PackageApk {
    public static void main(String[] args) throws IOException {
        Set<String> names = new HashSet<>();
        try (ZipFile resources = new ZipFile(args[0]);
             ZipOutputStream output = new ZipOutputStream(Files.newOutputStream(Path.of(args[2])))) {
            var entries = resources.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                if (entry.isDirectory()) continue;
                try (InputStream input = resources.getInputStream(entry)) {
                    write(output, names, entry.getName().replace('\\', '/'), input.readAllBytes());
                }
            }
            write(output, names, "classes.dex", Files.readAllBytes(Path.of(args[1])));
        }
    }

    private static void write(ZipOutputStream output, Set<String> names, String name, byte[] data) throws IOException {
        if (!names.add(name)) throw new IOException("Duplicate APK entry: " + name);
        CRC32 crc = new CRC32();
        crc.update(data);
        ZipEntry entry = new ZipEntry(name);
        entry.setMethod(ZipEntry.STORED);
        entry.setSize(data.length);
        entry.setCompressedSize(data.length);
        entry.setCrc(crc.getValue());
        output.putNextEntry(entry);
        output.write(data);
        output.closeEntry();
    }
}
